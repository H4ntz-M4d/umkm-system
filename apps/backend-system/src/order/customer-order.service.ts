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
import { CheckoutDto, MyOrderQueryDto } from 'order/dto/order.dto';
import {
  customerOrderInclude,
  toCustomerOrderResponse,
} from './customer-order.response';

/// Ongkir masih digratiskan. Ditulis sebagai konstanta, bukan angka lepas, agar
/// jelas di mana nanti perhitungan ongkir sungguhan dipasang.
const SHIPPING_COST = 0;

/// Dipakai membentuk tautan kembali dari halaman Midtrans ke halaman pesanan.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:3000';

type PaidOrder = {
  id: bigint;
  storeId: bigint;
  totalAmount: Prisma.Decimal;
  items: {
    productVariantId: bigint;
    quantity: number;
    type: string;
    idPm: bigint;
  }[];
};

@Injectable()
export class CustomerOrderService {
  constructor(private readonly midtransService: MidtransService) {}

  /**
   * Efek samping saat pesanan lunas: catat mutasi stok, catat kas masuk, lalu
   * kurangi stok. Cerminan paidOperation milik POS, dengan sumber ONLINE_ORDER.
   */
  private async paidOperationOrder(
    order: PaidOrder,
    tx: Prisma.TransactionClient,
  ) {
    await tx.inventoryLedger.createMany({
      data: order.items.map((item) => ({
        itemType: 'PRODUCT_VARIANT' as const,
        itemId: item.productVariantId,
        source: 'ONLINE_ORDER' as const,
        referenceId: order.id,
        direction: 'OUT' as const,
        quantity: item.quantity,
        storeId: order.storeId,
      })),
    });

    // Penjualan online adalah kas MASUK. Perhatikan bahwa paidOperation di POS
    // menulisnya sebagai OUT/EXPENSE — itu tampaknya keliru dan sengaja tidak
    // ditiru di sini.
    await tx.cashTransaction.create({
      data: {
        type: 'IN',
        source: 'ORDER',
        referenceId: order.id,
        amount: order.totalAmount,
        storeId: order.storeId,
      },
    });

    for (const item of order.items) {
      if (item.type === 'PRE_ORDER') {
        await tx.productPreOrderDetails.update({
          where: { productMasterId: item.idPm },
          data: {
            maxQuota: { decrement: item.quantity },
            quotaTarget: { decrement: item.quantity },
          },
        });
        continue;
      } else if (item.type === 'MADE_TO_ORDER') {
        continue;
      }
      /**
       * Toko diambil dari pesanannya, bukan dihitung ulang dari penanda
       * `isOnlineSource` saat ini.
       *
       * Bedanya baru terasa saat pembatalan atau refund: kalau saat itu toko
       * sumber online sudah berpindah, menghitung ulang akan mengembalikan stok
       * ke toko yang salah — dan selisihnya tidak akan ketahuan karena kedua
       * angkanya tetap terlihat wajar. Pesanan harus mengingat dari mana
       * barangnya diambil.
       */
      await tx.productVariantStock.update({
        where: {
          productVariantId_storeId: {
            productVariantId: item.productVariantId,
            storeId: order.storeId,
          },
        },
        data: {
          stock: { decrement: item.quantity },
          reserved_stock: { increment: item.quantity },
        },
      });
    }
  }

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

    // Stok diperiksa ulang di sini, bukan mengandalkan yang tersimpan di
    // keranjang — barang bisa saja terjual lewat POS sejak dimasukkan.
    for (const item of cart.cartItems) {
      const stock = item.variant.productVariantStocks[0]?.stock ?? 0;
      if (
        item.variant.productMaster.type !== 'MADE_TO_ORDER' &&
        item.variant.productMaster.type !== 'PRE_ORDER'
      ) {
        if (stock < item.quantity) {
          const variantNames = item.variant.options
            .map((opt) => opt.variantValue.value)
            .join(' - ');

          throw new BadRequestException(
            `Maaf stock dari ${item.variant.productMaster.name}${
              variantNames ? ` variant ${variantNames}` : ''
            } tidak mencukupi`,
          );
        }
      }
    }

    const shipmentInput = await this.resolveShipment(customerId, dto);

    /// Toko pemenuh pesanan ditentukan dari penandanya, bukan dari urutan
    /// pembuatan toko seperti sebelumnya — lihat `findOnlineSourceStore`.
    const [store, paymentMethod, customer] = await Promise.all([
      findOnlineSourceStore(),
      prisma.paymentMethod.findFirst({
        where: { isActive: true, channel: 'MIDTRANS' },
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

  /// Alamat pengiriman dibekukan ke Shipment, entah diambil dari buku alamat
  /// atau diketik langsung — supaya riwayat pesanan tidak ikut berubah saat
  /// customer mengedit alamatnya.
  private async resolveShipment(customerId: bigint, dto: CheckoutDto) {
    if (dto.addressId) {
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
          data: { status: OrderStatus.PAID },
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

        await this.paidOperationOrder(order, tx);
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
              select: { productMaster: { select: { id: true, type: true } } },
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
              select: { productMaster: { select: { id: true, type: true } } },
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
