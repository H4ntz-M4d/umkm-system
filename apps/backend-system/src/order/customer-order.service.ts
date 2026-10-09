import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderStatus, Prisma, prisma } from '@repo/db';
import { idFormat } from 'common/helpers/id-format';
import { resolveCustomerId } from 'common/helpers/resolve-customer';
import {
  onlineStockSelect,
  findOnlineSourceStore,
} from 'common/helpers/online-store';
import { MidtransService } from 'midtrans/midtrans.service';
import {
  CheckoutDto,
  MyOrderQueryDto,
  SubmitOrderDto,
} from 'order/dto/order.dto';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import {
  lockOrderStock,
  syncOrderCashIn,
  type PaidOrder,
} from 'common/helpers/order-paid-effects';
import {
  customerOrderInclude,
  toCustomerOrderResponse,
} from './customer-order.response';

/// Ongkir masih digratiskan. Ditulis sebagai konstanta, bukan angka lepas, agar
/// jelas di mana nanti perhitungan ongkir sungguhan dipasang.
const SHIPPING_COST = 0;

/// Dipakai membentuk tautan kembali dari halaman Midtrans ke halaman pesanan.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/// Bentuk minimal yang dibutuhkan `resolveShipment`. Ditulis struktural supaya
/// dipenuhi baik oleh CheckoutDto (alur lama) maupun SubmitOrderDto (alur WA).
type ShipmentSource = {
  addressId?: string;
  shipment?: {
    recipientName: string;
    phone: string;
    addressLine: string;
    city: string;
    province: string;
  };
  courier: string;
};

@Injectable()
export class CustomerOrderService {
  constructor(private readonly midtransService: MidtransService) {}

  async checkout(userId: bigint, dto: CheckoutDto) {
    const customerId = await resolveCustomerId(userId);

    const cart = await prisma.cart.findUnique({
      where: { customerId },
      include: {
        cartItems: {
          include: {
            variant: {
              select: {
                id: true,
                price: true,
                productMaster: { select: { name: true, type: true } },
                productVariantStocks: onlineStockSelect,
                options: {
                  select: { variantValue: { select: { value: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException(
        'Keranjang kosong, tidak bisa melakukan checkout',
      );
    }

    // Pengecekan stok ready stock dibuang sejak READY_STOCK digabung ke
    // REGULAR: pesanan online tidak lagi mengambil dari stok toko.

    const shipmentInput = await this.resolveShipment(customerId, dto);

    /// Toko pemenuh pesanan ditentukan dari penandanya, bukan dari urutan
    /// pembuatan toko seperti sebelumnya — lihat `findOnlineSourceStore`.
    const store = await findOnlineSourceStore();

    const [paymentMethod, customer] = await Promise.all([
      /// Metode milik toko pemenuh pesanan, atau yang berlaku umum. Sejak
      /// metode pembayaran terikat toko, mengambil QRIS mana pun yang aktif
      /// bisa membuat uang pembeli mendarat di rekening cabang lain.
      prisma.paymentMethod.findFirst({
        where: {
          isActive: true,
          channel: 'MIDTRANS',
          OR: [{ storeId: null }, { storeId: store.id }],
        },
        orderBy: { id: 'asc' },
      }),
      prisma.customer.findUnique({ where: { id: customerId } }),
    ]);

    if (!paymentMethod) {
      throw new BadRequestException(
        'Metode pembayaran Midtrans belum tersedia. Hubungi admin.',
      );
    }

    // Harga diambil dari ProductVariant, bukan dari apa pun yang dikirim client.
    const orderItems = cart.cartItems.map((item) => ({
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      price: item.variant.price,
      subtotal: item.variant.price.mul(item.quantity),
      productName: item.variant.productMaster.name,
    }));

    const itemsTotal = orderItems.reduce(
      (total, item) => total.add(item.subtotal),
      new Prisma.Decimal(0),
    );
    const totalAmount = itemsTotal.add(SHIPPING_COST);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderId: idFormat('ORDER'),
          storeId: store.id,
          customerId,
          paymentMethodId: paymentMethod.id,
          status: OrderStatus.PENDING,
          /// Di alur lama keduanya memang selalu sama: harga katalog dipakai
          /// apa adanya, tidak ada nego.
          estimatedTotal: totalAmount,
          totalAmount,
          items: {
            create: orderItems.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
          shipment: {
            create: { ...shipmentInput, shippingCost: SHIPPING_COST },
          },
        },
      });

      if (dto.saveAddress && dto.shipment) {
        // Alamat pertama otomatis jadi default, sama seperti AddressService.create,
        // supaya checkout berikutnya langsung punya alamat terpilih.
        const addressCount = await tx.customerAddress.count({
          where: { customerId },
        });

        await tx.customerAddress.create({
          data: { ...dto.shipment, customerId, isDefault: addressCount === 0 },
        });
      }

      return created;
    });

    // Snap dipanggil DI LUAR transaksi supaya panggilan jaringan tidak menahan
    // kunci basis data. Keranjang juga belum dikosongkan sampai token terbit,
    // agar isinya tidak lenyap bila Midtrans gagal.
    try {
      const snap = await this.midtransService.createSnapTransaction({
        orderId: order.orderId,
        items: orderItems.map((item) => ({
          id: String(item.productVariantId),
          name: item.productName,
          price: Number(item.price),
          quantity: item.quantity,
        })),
        shippingCost: SHIPPING_COST,
        customer: {
          name: customer?.name,
          email: customer?.email,
          phone: customer?.phone ?? undefined,
        },
        // Tanpa ini, tombol "Return to merchant page" di halaman Snap memakai
        // Finish Redirect URL dashboard yang bawaannya https://example.com.
        finishUrl: `${FRONTEND_URL}/orders/${order.orderId}`,
      });

      await prisma.$transaction([
        prisma.order.update({
          where: { id: order.id },
          data: { paymentGatewayRef: snap.token },
        }),
        prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
      ]);

      return {
        orderId: order.orderId,
        snapToken: snap.token,
        redirectUrl: snap.redirectUrl,
        totalAmount: String(totalAmount),
      };
    } catch (error) {
      // Pesanan yang tidak berhasil mendapat token tidak akan pernah bisa
      // dibayar, jadi langsung dibatalkan agar tidak menggantung.
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      throw new BadRequestException(
        `Gagal membuat pembayaran: ${
          error instanceof Error ? error.message : 'terjadi kesalahan'
        }`,
      );
    }
  }

  /**
   * Pengajuan pesanan dari katalog — pengganti `checkout()`.
   *
   * Tidak ada pembayaran di sini sama sekali. Pesanan masuk berstatus PENDING
   * ("Mengajukan"), lalu harga dan DP-nya disepakati di WhatsApp dan dicatat
   * admin belakangan. Karena itu tidak ada stok maupun kas yang bergerak pada
   * tahap ini — semuanya baru jalan saat admin menetapkan PAID.
   *
   * Isi keranjang datang dari client, berbeda dengan `checkout()` yang
   * membacanya dari tabel Cart: keranjang tamu hanya hidup di localStorage
   * browser dan tidak pernah tersinkron ke server. Yang dipercaya dari client
   * cuma varian dan jumlahnya — harganya tetap dibaca ulang dari
   * `ProductVariant.price` di sini.
   */
  async submitOrderRequest(user: JwtPayload | null, dto: SubmitOrderDto) {
    const customerId = user ? await resolveCustomerId(user.sub) : null;

    const customer = customerId
      ? await prisma.customer.findUnique({
          where: { id: customerId },
          select: { name: true, phone: true },
        })
      : null;

    /// Yang diketik di form menang atas data akun: pemesan boleh memakai nomor
    /// lain untuk pesanan ini tanpa harus mengubah profilnya.
    const buyerName = dto.buyerName?.trim() || customer?.name || null;
    const buyerPhone = dto.buyerPhone?.trim() || customer?.phone || null;

    // Seluruh kelanjutan pesanan terjadi lewat WhatsApp, jadi pesanan tanpa
    // nomor yang bisa dihubungi tidak ada artinya — termasuk untuk customer
    // yang sudah masuk tapi profilnya belum berisi nomor.
    if (!buyerName || !buyerPhone) {
      throw new BadRequestException(
        'Nama dan nomor WhatsApp wajib diisi supaya pesanan bisa ditindaklanjuti',
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: dto.items.map((item) => BigInt(item.productVariantId)) },
      },
      select: {
        id: true,
        price: true,
        productMaster: {
          select: {
            id: true,
            name: true,
            type: true,
            /// Dibaca di sini, bukan query terpisah per item, supaya
            /// pengecekan kuota di bawah tidak menambah round-trip DB.
            productPreOrderDetail: { select: { maxQuota: true } },
          },
        },
      },
    });

    const variantById = new Map(
      variants.map((variant) => [variant.id.toString(), variant]),
    );

    const orderItems = dto.items.map((item) => {
      const variant = variantById.get(item.productVariantId);

      if (!variant) {
        throw new BadRequestException(
          'Ada produk yang sudah tidak tersedia. Muat ulang keranjang Anda.',
        );
      }

      return {
        productMasterId: variant.productMaster.id,
        productName: variant.productMaster.name,
        productType: variant.productMaster.type,
        maxQuota: variant.productMaster.productPreOrderDetail?.maxQuota ?? null,
        productVariantId: variant.id,
        quantity: item.quantity,
        price: variant.price,
        subtotal: variant.price.mul(item.quantity),
        notes: item.notes?.trim() || null,
      };
    });

    /**
     * Kuota pre-order dijaga di sini, bukan hanya nanti saat admin menandai
     * lunas.
     *
     * Kuota baru benar-benar berkurang di database saat pesanan lunas (sesuai
     * keputusan sebelumnya — tidak ada yang bergerak sebelum uangnya nyata
     * diterima), tapi itu tidak berarti pengajuan yang jelas-jelas sudah
     * melebihi sisa kuota SAAT INI boleh diterima begitu saja. Menerimanya lalu
     * baru menolak saat admin sudah selesai nego adalah pengalaman yang buruk.
     *
     * Kuota MILIK PRODUK, bukan per varian — pilihan warna/ukuran tidak
     * membuka kuota terpisah, jadi beberapa varian dari produk yang sama
     * dijumlahkan dulu sebelum dibandingkan.
     *
     * Ini pemahaman kuota untuk sekarang; kalau nanti ternyata beda (mis.
     * kuota per varian, atau PO boleh melebihi batas), logika di sini yang
     * perlu disesuaikan.
     */
    const requestedByProduct = new Map<string, number>();
    for (const item of orderItems) {
      if (item.productType !== 'PRE_ORDER') continue;
      const key = item.productMasterId.toString();
      requestedByProduct.set(
        key,
        (requestedByProduct.get(key) ?? 0) + item.quantity,
      );
    }

    const checkedProduct = new Set<string>();
    for (const item of orderItems) {
      if (item.productType !== 'PRE_ORDER') continue;
      const key = item.productMasterId.toString();
      // Dicek sekali per produk meski loop-nya jalan per item — varian lain
      // dari produk yang sama tidak perlu ditolak berulang dengan pesan yang
      // sama persis.
      if (checkedProduct.has(key)) continue;
      checkedProduct.add(key);

      const requested = requestedByProduct.get(key)!;

      if (item.maxQuota === null) {
        throw new BadRequestException(
          `${item.productName} sudah tidak menerima pre-order (kuota tidak ditemukan)`,
        );
      }

      if (item.maxQuota < requested) {
        throw new BadRequestException(
          `Kuota pre-order ${item.productName} tersisa ${item.maxQuota}, tidak cukup untuk ${requested} pcs yang diminta`,
        );
      }
    }

    const estimatedTotal = orderItems.reduce(
      (total, item) => total.add(item.subtotal),
      new Prisma.Decimal(0),
    );

    /// Toko pembukuan pesanan tetap toko sumber online, termasuk untuk pesanan
    /// yang diambil sendiri — yang berpindah cuma cara serah terimanya, bukan
    /// dari toko mana pesanan itu dicatat.
    const store = await findOnlineSourceStore();

    const shipmentInput =
      dto.deliveryMethod === 'SHIP'
        ? /// courier dipastikan ada oleh superRefine di SubmitOrderSchema
          /// untuk deliveryMethod "SHIP".
          await this.resolveShipment(customerId, {
            ...dto,
            courier: dto.courier!,
          })
        : null;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderId: idFormat('ORDER'),
          storeId: store.id,
          customerId,
          status: OrderStatus.PENDING,
          deliveryMethod: dto.deliveryMethod,
          estimatedTotal,
          /// Sama dulu dengan estimasi; ditimpa admin begitu nego selesai.
          totalAmount: estimatedTotal,
          buyerName,
          buyerPhone,
          // Hanya kolom milik OrderItem yang dikirim — orderItems membawa
          // productMasterId/productName/productType/maxQuota tambahan, dipakai
          // untuk pengecekan kuota di atas, bukan bagian dari baris OrderItem.
          items: {
            create: orderItems.map((item) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.subtotal,
              notes: item.notes,
            })),
          },
          ...(shipmentInput && {
            shipment: {
              create: { ...shipmentInput, shippingCost: SHIPPING_COST },
            },
          }),
        },
      });

      if (customerId && dto.saveAddress && dto.shipment) {
        // Alamat pertama otomatis jadi default, sama seperti AddressService.create.
        const addressCount = await tx.customerAddress.count({
          where: { customerId },
        });

        await tx.customerAddress.create({
          data: { ...dto.shipment, customerId, isDefault: addressCount === 0 },
        });
      }

      // Hanya customer yang login punya keranjang di server; keranjang tamu
      // dikosongkan di browser setelah pengajuan berhasil.
      if (customerId) {
        const cart = await tx.cart.findUnique({
          where: { customerId },
          select: { id: true },
        });

        if (cart) {
          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        }
      }

      return created;
    });

    return {
      orderId: order.orderId,
      estimatedTotal: String(estimatedTotal),
      totalItems: orderItems.reduce((total, item) => total + item.quantity, 0),
      /// Tamu tidak bisa membuka /orders yang login-gated, jadi frontend perlu
      /// tahu apakah pesanan ini tertaut akun sebelum mengarahkan ke sana.
      isGuest: customerId === null,
    };
  }

  /// Alamat pengiriman dibekukan ke Shipment, entah diambil dari buku alamat
  /// atau diketik langsung — supaya riwayat pesanan tidak ikut berubah saat
  /// customer mengedit alamatnya.
  ///
  /// `customerId` boleh null sejak tamu bisa memesan: yang tidak punya sesi
  /// wajib mengetik alamatnya, karena buku alamat itu milik akun.
  private async resolveShipment(
    customerId: bigint | null,
    dto: ShipmentSource,
  ) {
    if (dto.addressId) {
      /// Dijaga eksplisit, bukan mengandalkan perbandingan customerId di bawah
      /// yang kebetulan juga gagal untuk null: tanpa ini, tamu bisa menyebut
      /// ID alamat milik orang lain dan isinya ikut tersalin ke pesanan.
      if (!customerId) {
        throw new BadRequestException(
          'Alamat tersimpan hanya bisa dipakai oleh akun yang sudah masuk',
        );
      }

      const address = await prisma.customerAddress.findUnique({
        where: { id: BigInt(dto.addressId) },
      });

      if (!address || address.customerId !== customerId) {
        throw new NotFoundException('Alamat tidak ditemukan');
      }

      return {
        recipientName: address.recipientName,
        phone: address.phone,
        addressLine: address.addressLine,
        city: address.city,
        province: address.province,
        courier: dto.courier,
      };
    }

    return { ...dto.shipment!, courier: dto.courier };
  }

  async findMyOrders(userId: bigint, query: MyOrderQueryDto) {
    const customerId = await resolveCustomerId(userId);
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;

    const where: Prisma.OrderWhereInput = {
      customerId,
      ...(query.status && { status: OrderStatus[query.status] }),
    };

    const [data, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: customerOrderInclude,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toCustomerOrderResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async findMyOrderDetail(userId: bigint, orderId: string) {
    const customerId = await resolveCustomerId(userId);

    // customerId ikut jadi syarat, jadi pesanan milik orang lain tidak bisa
    // dibuka hanya dengan menebak nomor order.
    const order = await prisma.order.findFirst({
      where: { orderId, customerId },
      include: customerOrderInclude,
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    return toCustomerOrderResponse(order);
  }

  /**
   * Menerapkan status pembayaran ke sebuah order.
   *
   * Dipakai bersama oleh webhook DAN penarikan status manual, supaya keduanya
   * tidak bisa berbeda perilaku. Idempoten: order yang sudah PAID tidak diproses
   * ulang, jadi stok dan kas tidak pernah tercatat dua kali.
   */
  private async applyPaymentStatus(
    order: PaidOrder & { status: OrderStatus },
    transactionStatus: string,
    fraudStatus?: string,
  ) {
    const isSuccess =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept');
    const isFailed = ['expire', 'cancel', 'deny', 'failure'].includes(
      transactionStatus,
    );

    if (isSuccess) {
      if (order.status === OrderStatus.PAID) return order.status;

      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: { status: OrderStatus.PAID, stockLockedAt: new Date() },
          select: {
            items: {
              select: {
                variant: {
                  select: { productMaster: { select: { type: true } } },
                },
              },
            },
          },
        });

        /// Jalur lama (tanpa rute) ikut aturan kunci stok yang sama, supaya
        /// tidak ada dua versi aturan stok pesanan.
        await lockOrderStock(order, tx);
        /// Alur lama selalu lunas sekali jalan, jadi targetnya nilai penuh.
        await syncOrderCashIn(order, order.totalAmount, tx);
      });

      return OrderStatus.PAID;
    }

    if (isFailed && order.status === OrderStatus.PENDING) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      });

      return OrderStatus.CANCELLED;
    }

    return order.status;
  }

  /**
   * Menyelaraskan status pesanan dengan keadaan sebenarnya di Midtrans.
   *
   * Notifikasi webhook bisa tidak pernah sampai — URL salah, server sedang mati,
   * atau jaringan putus — dan pesanan akan menggantung PENDING padahal pembeli
   * sudah membayar. Midtrans tidak punya API untuk meminta kirim ulang, jadi
   * di sini status ditarik sendiri lalu diterapkan lewat jalur yang sama dengan
   * webhook.
   */
  async syncPaymentStatus(userId: bigint, orderId: string) {
    const customerId = await resolveCustomerId(userId);

    const orderRaw = await prisma.order.findFirst({
      where: { orderId, customerId },
      include: {
        items: {
          select: {
            productVariantId: true,
            quantity: true,
            variant: {
              select: {
                productMaster: { select: { id: true, name: true, type: true } },
              },
            },
          },
        },
      },
    });

    if (!orderRaw) throw new NotFoundException('Pesanan tidak ditemukan');

    // Yang sudah selesai tidak perlu ditanyakan lagi ke Midtrans.
    if (orderRaw.status !== OrderStatus.PENDING) {
      return {
        orderId: orderRaw.orderId,
        status: orderRaw.status,
        changed: false,
      };
    }

    const midtransStatus = await this.midtransService
      .getTransactionStatus(orderRaw.orderId)
      .catch(() => null);

    // Belum ada transaksinya di Midtrans (pembeli belum membuka pembayaran).
    if (!midtransStatus) {
      return {
        orderId: orderRaw.orderId,
        status: orderRaw.status,
        changed: false,
      };
    }

    const order: PaidOrder & { status: OrderStatus } = {
      ...orderRaw,
      items: orderRaw.items.map((item) => ({
        idPm: item.variant.productMaster.id,
        productName: item.variant.productMaster.name,
        type: item.variant.productMaster.type,
        ...item,
      })),
    };

    const status = await this.applyPaymentStatus(
      order,
      midtransStatus.transactionStatus,
      midtransStatus.fraudStatus,
    );

    return {
      orderId: orderRaw.orderId,
      status,
      changed: status !== order.status,
    };
  }

  /* eslint-disable */
  async handleMidtransWebHook(body: any) {
    const isValid = this.midtransService.verifyWebhookSignature({
      orderId: body.order_id,
      statusCode: body.status_code,
      grossAmount: body.gross_amount,
      signature: body.signature_key,
    });

    if (!isValid) throw new UnauthorizedException('Invalid signature');

    const orderRaw = await prisma.order.findUnique({
      where: { orderId: body.order_id },
      include: {
        items: {
          select: {
            productVariantId: true,
            quantity: true,
            variant: {
              select: {
                productMaster: { select: { id: true, name: true, type: true } },
              },
            },
          },
        },
      },
    });

    // Nomor order tak dikenal biasanya milik PosTransaction; balas 200 supaya
    // Midtrans tidak mengulang kirim terus-menerus.
    if (!orderRaw) return { received: true };

    const order: PaidOrder & { status: OrderStatus } = {
      ...orderRaw,
      items: orderRaw.items.map((item) => ({
        idPm: item.variant.productMaster.id,
        productName: item.variant.productMaster.name,
        type: item.variant.productMaster.type,
        ...item,
      })),
    };
    await this.applyPaymentStatus(
      order,
      body.transaction_status,
      body.fraud_status,
    );

    return { received: true };
  }
  /* eslint-enable */
}
