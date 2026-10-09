import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, prisma } from '@repo/db';
import { ORDER_NEGOTIATION_TRANSITIONS, OrderData, z } from '@repo/schemas';
import {
  OrderQueryDto,
  UpdateOrderNegotiationDto,
  UpdateShipmentDto,
} from 'order/dto/order.dto';
import { toOrderResponse } from './order.response';
import {
  completeOrderStock,
  lockOrderStock,
  netOrderCash,
  recordOrderRefund,
  returnOrderStock,
  syncOrderCashIn,
  writeOffOrderStock,
  type PaidOrder,
} from 'common/helpers/order-paid-effects';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';
import { assertPaymentMethodForStore } from 'payment/payment/payment.service';

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Mengajukan',
  DP: 'DP Dibayar',
  PRODUCTION_DONE: 'Produksi Selesai',
  PAID: 'Lunas',
  SHIPPED: 'Dikirim',
  COMPLETED: 'Selesai',
  CANCELLED: 'Dibatalkan',
  REFUNDED: 'Refund',
};

/// Status yang sudah tutup buku: angkanya sudah masuk laporan, stoknya sudah
/// diselesaikan. Tidak ada jalan keluar dari sini.
const FINAL_STATUSES: OrderStatus[] = [
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
  OrderStatus.REFUNDED,
];

/// Status sebelum Lunas — satu-satunya asal yang boleh mengunci stok.
const PRE_PAID_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.DP,
  OrderStatus.PRODUCTION_DONE,
];

/// Item pesanan dalam bentuk yang dibutuhkan efek stok — dipakai dialog nego
/// dan sheet pengiriman, supaya keduanya menjalankan aturan stok yang sama.
const ORDER_ITEMS_FOR_STOCK = {
  select: {
    productVariantId: true,
    quantity: true,
    variant: {
      select: {
        productMaster: { select: { id: true, name: true, type: true } },
      },
    },
  },
} satisfies Prisma.Order$itemsArgs;

function toPaidOrder(order: {
  id: bigint;
  storeId: bigint;
  totalAmount: Prisma.Decimal;
  items: Prisma.OrderItemGetPayload<typeof ORDER_ITEMS_FOR_STOCK>[];
}): PaidOrder {
  return {
    id: order.id,
    storeId: order.storeId,
    totalAmount: order.totalAmount,
    items: order.items.map((item) => ({
      productVariantId: item.productVariantId,
      productName: item.variant.productMaster.name,
      quantity: item.quantity,
      type: item.variant.productMaster.type,
      idPm: item.variant.productMaster.id,
    })),
  };
}

/**
 * Menentukan siapa yang tercatat sebagai pemroses pesanan.
 *
 * Tiga keadaan, dan yang ketiga yang paling penting:
 *
 *  - admin memilih nama di dialog        -> pakai pilihannya
 *  - tidak memilih & kolomnya masih kosong -> ambil dari token (jejak pertama)
 *  - tidak memilih & kolomnya sudah terisi -> JANGAN sentuh
 *
 * Yang terakhir membuat admin berikutnya tidak diam-diam menggeser nama
 * rekannya hanya karena ia yang kebetulan menekan Simpan.
 */
function resolveProcessedBy(
  currentUserId: bigint | null,
  requestedUserId: string | undefined,
  actor: JwtPayload,
): bigint | undefined {
  if (requestedUserId !== undefined) return BigInt(requestedUserId);
  if (currentUserId === null) return BigInt(actor.sub);
  return undefined;
}

const STALE_STATUS_MESSAGE =
  'Status pesanan baru saja diubah orang lain. Muat ulang halaman untuk melihat keadaan terbaru.';

@Injectable()
export class OrderService {
  /// Dipakai bersama listing dan ekspor, supaya berkas Excel menyaring persis
  /// sama dengan yang tampil di layar.
  private buildWhere(query: OrderQueryDto): Prisma.OrderWhereInput {
    return {
      ...(query.store && {
        storeId: BigInt(query.store),
      }),
      ...(query.status && {
        status: OrderStatus[query.status],
      }),
      ...(query.search && {
        OR: [
          {
            orderId: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            customer: {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          gte: query.dateFrom ? toStartOfDay(query.dateFrom) : undefined,
          lte: query.dateTo ? toEndOfDay(query.dateTo) : undefined,
        },
      }),
    };
  }

  async findAll(query: OrderQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;

    const whereClause = this.buildWhere(query);

    const data = await prisma.order.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        payment: {
          select: {
            name: true,
          },
        },
        user: {
          select: {
            employees: {
              select: {
                name: true,
              },
            },
          },
        },
        items: {
          include: {
            variant: {
              select: {
                sku: true,
                productMaster: {
                  select: {
                    name: true,
                  },
                },
                options: {
                  select: {
                    variantValue: {
                      select: {
                        value: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        shipment: true,
      },
    });

    const total = await prisma.order.count({
      where: whereClause,
    });

    const result = z.array(OrderData).parse(data.map(toOrderResponse));

    return {
      success: true,
      data: result,
      meta: {
        skip: skip,
        limit: limit,
        total: total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Status pengiriman untuk pesanan berkurir, sekaligus penggerak status
   * pesanannya:
   *
   *  - Dikemas  : boleh kapan saja sebelum dikirim, tidak menggeser pesanan.
   *  - Dikirim  : hanya setelah Lunas → pesanan jadi Dikirim.
   *  - Diterima : hanya setelah Dikirim → pesanan jadi Selesai, dan stok yang
   *               dikunci saat Lunas resmi keluar (aturan yang sama dengan
   *               Selesai di dialog nego untuk pesanan ambil di tempat).
   *
   * Ongkir yang diisi admin di sini MURNI CATATAN: tidak menambah tagihan
   * customer dan tidak menyentuh kas, karena harga yang berlaku adalah hasil
   * nego di WhatsApp dan belum diputuskan apakah ongkir sudah termasuk di
   * dalamnya. Kalau nanti diputuskan ikut ditagih, yang perlu diubah adalah
   * `totalAmount` pesanan lewat `syncOrderCashIn`, bukan baris di bawah.
   *
   * Tidak ada "Dibatalkan" di sini (ditolak skema `ShipmentUpdateStatus`):
   * membatalkan pesanan perlu nominal pengembalian dan mengembalikan stok,
   * jadi lewat dialog pesanan.
   */
  async updateShipment(orderId: string, data: UpdateShipmentDto) {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { shipment: true, items: ORDER_ITEMS_FOR_STOCK },
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');
    if (!order.shipment) {
      throw new BadRequestException(
        'Pesanan ini tidak memiliki data pengiriman',
      );
    }

    if (FINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        `Pesanan ini sudah ${STATUS_LABEL[order.status]}, data pengirimannya tidak bisa diubah lagi`,
      );
    }

    let nextOrderStatus: OrderStatus | undefined;

    if (data.status === 'PACKAGING' && order.status === OrderStatus.SHIPPED) {
      throw new BadRequestException(
        'Pesanan sudah dikirim, status pengiriman tidak bisa mundur ke Dikemas',
      );
    }

    if (data.status === 'SHIPPED') {
      if (
        order.status !== OrderStatus.PAID &&
        order.status !== OrderStatus.SHIPPED
      ) {
        throw new BadRequestException(
          `Pesanan harus Lunas dulu sebelum dikirim (status sekarang: ${STATUS_LABEL[order.status]})`,
        );
      }
      if (order.status === OrderStatus.PAID) {
        nextOrderStatus = OrderStatus.SHIPPED;
      }
    }

    if (data.status === 'DELIVERED') {
      if (order.status !== OrderStatus.SHIPPED) {
        throw new BadRequestException(
          `Tandai pesanan Dikirim dulu sebelum Diterima (status sekarang: ${STATUS_LABEL[order.status]})`,
        );
      }
      nextOrderStatus = OrderStatus.COMPLETED;
    }

    /// Pesanan lama yang stoknya tidak pernah dikunci tetap Selesai, tanpa
    /// menyentuh stok.
    const isCompleting =
      nextOrderStatus === OrderStatus.COMPLETED && order.stockLockedAt !== null;

    const shipment = await prisma.$transaction(async (tx) => {
      if (nextOrderStatus) {
        const claimed = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: nextOrderStatus },
        });
        if (claimed.count === 0) {
          throw new BadRequestException(STALE_STATUS_MESSAGE);
        }
      }

      if (isCompleting) await completeOrderStock(toPaidOrder(order), tx);

      return tx.shipment.update({
        where: { id: order.shipment!.id },
        data: {
          status: data.status,
          trackingNumber: data.trackingNumber ?? null,
          /**
           * Ongkir hanya ditimpa kalau memang dikirim.
           *
           * Field ini opsional, dan sheet pengiriman bisa menyimpan hal lain
           * (mis. cuma nomor resi) tanpa menyertakannya. Memakai `?? 0` di
           * sini akan diam-diam menghapus ongkir yang sudah dicatat.
           */
          ...(data.shippingCost !== undefined && {
            shippingCost: data.shippingCost,
          }),
          /// Alasan yang sama dengan ongkir: sheet bisa menyimpan hal lain
          /// tanpa menyertakan catatan paket, dan `?? null` akan menghapus
          /// catatan yang sudah ada tanpa ada yang meminta.
          ...(data.totalWeight !== undefined && {
            totalWeight: data.totalWeight,
          }),
          ...(data.unitWeight !== undefined && {
            unitWeight: data.unitWeight,
          }),
          ...(data.unitPrice !== undefined && { unitPrice: data.unitPrice }),
        },
      });
    });

    return {
      orderId: order.orderId,
      shipmentStatus: shipment.status,
      trackingNumber: shipment.trackingNumber,
      shippingCost: String(shipment.shippingCost),
      totalWeight: shipment.totalWeight,
      unitWeight: shipment.unitWeight,
      unitPrice: shipment.unitPrice ? String(shipment.unitPrice) : null,
      orderStatus: nextOrderStatus ?? order.status,
    };
  }

  /**
   * Mencatat hasil negosiasi WhatsApp ke pesanan.
   *
   * Harga di katalog cuma gambaran — yang berlaku adalah angka yang disepakati
   * di WhatsApp, dan itu diisi manual di sini bersama nominal DP yang sudah
   * masuk. Tidak ada rumus yang mengikat `totalAmount` ke akumulasi harga
   * item; `estimatedTotal` disimpan terpisah hanya sebagai pembanding.
   */
  async updateNegotiation(
    orderId: string,
    dto: UpdateOrderNegotiationDto,
    actor: JwtPayload,
  ) {
    const order = await prisma.order.findUnique({
      where: { orderId },
      include: { items: ORDER_ITEMS_FOR_STOCK },
    });

    if (!order) throw new NotFoundException('Pesanan tidak ditemukan');

    // Pesanan yang sudah tutup buku tidak boleh diutak-atik lagi: mengubahnya
    // berarti mengubah angka yang sudah masuk laporan bulan berjalan.
    if (FINAL_STATUSES.includes(order.status)) {
      throw new BadRequestException(
        'Pesanan ini sudah selesai atau dibatalkan, datanya tidak bisa diubah lagi',
      );
    }

    /// Sama seperti di kasir: metode pembayaran harus milik toko pemenuh
    /// pesanan ini, atau yang berlaku umum.
    if (dto.paymentMethodId) {
      await assertPaymentMethodForStore(
        BigInt(dto.paymentMethodId),
        order.storeId,
      );
    }

    const nextStatus = dto.status ?? order.status;
    const isTransition = nextStatus !== order.status;

    /**
     * Peta perpindahan yang sama dengan yang dipakai dialog admin. Dialog
     * hanya menawarkan pilihan yang sah, tapi server tetap memeriksa: tanpa
     * ini, satu permintaan langsung ke API bisa melompati Lunas dan membuat
     * stok tidak pernah dikunci.
     */
    if (isTransition) {
      if (nextStatus === OrderStatus.SHIPPED) {
        throw new BadRequestException(
          'Status Dikirim diatur lewat menu pengiriman, setelah pesanan Lunas',
        );
      }

      const allowed = ORDER_NEGOTIATION_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(nextStatus as (typeof allowed)[number])) {
        throw new BadRequestException(
          `Pesanan berstatus ${STATUS_LABEL[order.status]} tidak bisa diubah langsung ke ${STATUS_LABEL[nextStatus]}`,
        );
      }

      if (
        nextStatus === OrderStatus.COMPLETED &&
        order.deliveryMethod === 'SHIP'
      ) {
        throw new BadRequestException(
          'Pesanan yang dikirim kurir ditandai Selesai lewat menu pengiriman (status Diterima)',
        );
      }
    }

    /**
     * Pilihan "Diproses oleh" datang dari body, jadi tidak bisa dipercaya
     * begitu saja: id-nya harus menunjuk karyawan yang masih aktif. Tanpa
     * pemeriksaan ini, satu permintaan langsung ke API bisa menautkan pesanan
     * ke akun customer atau ke karyawan yang sudah nonaktif.
     */
    if (dto.userId !== undefined) {
      const handler = await prisma.users.findFirst({
        where: {
          id: BigInt(dto.userId),
          isActive: true,
          role: { in: ['OWNER', 'ADMIN', 'KASIR', 'GUDANG'] },
        },
        select: { id: true },
      });

      if (!handler) {
        throw new BadRequestException(
          'Karyawan yang dipilih tidak ditemukan atau sudah tidak aktif',
        );
      }
    }

    const nextUserId = resolveProcessedBy(order.userId, dto.userId, actor);

    const paidOrder = toPaidOrder(order);

    if (
      nextStatus === OrderStatus.CANCELLED ||
      nextStatus === OrderStatus.REFUNDED
    ) {
      return this.closeOrder(order, paidOrder, nextStatus, dto, nextUserId);
    }

    const nextTotal =
      dto.totalAmount !== undefined
        ? new Prisma.Decimal(dto.totalAmount)
        : order.totalAmount;
    const requestedDp =
      dto.dpAmount !== undefined
        ? dto.dpAmount === null
          ? null
          : new Prisma.Decimal(dto.dpAmount)
        : order.dpAmount;

    if (requestedDp && requestedDp.gt(nextTotal)) {
      throw new BadRequestException(
        'Nominal DP tidak boleh melebihi total kesepakatan',
      );
    }

    if (nextStatus === OrderStatus.DP && (!requestedDp || requestedDp.lte(0))) {
      throw new BadRequestException(
        'Isi nominal DP yang sudah dibayar sebelum menandai pesanan sebagai DP',
      );
    }

    /// Lunas/kirim/selesai sama-sama berarti uangnya sudah penuh; DP berarti
    /// baru sebagian.
    const isSettled =
      nextStatus === OrderStatus.PAID ||
      nextStatus === OrderStatus.SHIPPED ||
      nextStatus === OrderStatus.COMPLETED;

    /**
     * Begitu berstatus lunas, `dpAmount` TIDAK LAGI mengikuti input admin —
     * disamakan paksa dengan `nextTotal`, supaya halaman customer tidak
     * pernah menampilkan "Sisa: Rp X" pada pesanan yang sudah lunas.
     */
    const nextDp = isSettled ? nextTotal : requestedDp;

    /**
     * Stok dikunci tepat sekali: saat pertama kali pindah dari status sebelum
     * Lunas ke Lunas. Pesanan lama yang sudah lunas sebelum aturan ini ada
     * (`stockLockedAt` kosong, status sudah Lunas) tidak ikut dikunci —
     * sengaja dibiarkan apa adanya.
     */
    const isLocking =
      isSettled &&
      !order.stockLockedAt &&
      PRE_PAID_STATUSES.includes(order.status);

    /// Selesai hanya mengeluarkan stok yang memang pernah dikunci.
    const isCompleting =
      isTransition &&
      nextStatus === OrderStatus.COMPLETED &&
      order.stockLockedAt !== null;

    const updated = await prisma.$transaction(async (tx) => {
      /**
       * Bersyarat pada status yang tadi dibaca. Dua admin yang menekan Lunas
       * bersamaan sama-sama lolos semua pemeriksaan di atas; tanpa syarat
       * ini stoknya terkunci dua kali.
       */
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          totalAmount: nextTotal,
          dpAmount: nextDp,
          status: nextStatus,
          ...(isLocking && { stockLockedAt: new Date() }),
          ...(nextUserId !== undefined && { userId: nextUserId }),
          ...(dto.paymentMethodId !== undefined && {
            paymentMethodId: dto.paymentMethodId
              ? BigInt(dto.paymentMethodId)
              : null,
          }),
        },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(STALE_STATUS_MESSAGE);
      }

      // Kas dicatat bertahap mengikuti uang yang benar-benar masuk. Fungsinya
      // menghitung selisih terhadap yang sudah tercatat, jadi aman dipanggil
      // berulang maupun setelah nominalnya dikoreksi.
      if (isSettled) {
        await syncOrderCashIn(order, nextTotal, tx);
      } else if (nextStatus === OrderStatus.DP && nextDp) {
        await syncOrderCashIn(order, nextDp, tx);
      }

      if (isLocking) await lockOrderStock(paidOrder, tx);
      if (isCompleting) await completeOrderStock(paidOrder, tx);

      return tx.order.findUniqueOrThrow({ where: { id: order.id } });
    });

    return {
      orderId: updated.orderId,
      status: updated.status,
      totalAmount: String(updated.totalAmount),
      dpAmount: updated.dpAmount ? String(updated.dpAmount) : null,
      /// Sisa yang masih harus ditagih, supaya admin tidak menghitung manual.
      remainingAmount: String(
        updated.totalAmount.sub(updated.dpAmount ?? new Prisma.Decimal(0)),
      ),
    };
  }

  /**
   * Batal atau Refund — dua jalan menutup pesanan yang melibatkan uang
   * kembali.
   *
   *  - Batal (sebelum dikirim): uang dikembalikan sebesar yang diisi admin,
   *    bawaan 0 (DP hangus). Kalau sudah Lunas, barangnya kembali ke stok
   *    bebas dan kuota pre-order dikembalikan.
   *  - Refund (setelah dikirim): bawaan seluruh uang yang sudah masuk. Barang
   *    kembali ke stok hanya kalau admin mencentang `restock`; kalau tidak,
   *    barangnya dicatat keluar sebagai hilang.
   *
   * Total dan DP tidak diubah di sini: keduanya catatan kesepakatan, dan uang
   * yang kembali tercatat sebagai kas keluar terpisah.
   */
  private async closeOrder(
    order: {
      id: bigint;
      orderId: string;
      storeId: bigint;
      status: OrderStatus;
      stockLockedAt: Date | null;
    },
    paidOrder: PaidOrder,
    nextStatus: 'CANCELLED' | 'REFUNDED',
    dto: UpdateOrderNegotiationDto,
    /// Batal dan Refund juga ada yang memprosesnya, jadi jejaknya ikut
    /// ditulis dengan aturan yang sama seperti penyimpanan nego biasa.
    nextUserId: bigint | undefined,
  ) {
    const isRefund = nextStatus === OrderStatus.REFUNDED;

    const updated = await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status: nextStatus,
          ...(nextUserId !== undefined && { userId: nextUserId }),
        },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(STALE_STATUS_MESSAGE);
      }

      if (order.stockLockedAt) {
        if (!isRefund || dto.restock) await returnOrderStock(paidOrder, tx);
        else await writeOffOrderStock(paidOrder, tx);
      }

      const refund =
        dto.refundAmount !== undefined
          ? new Prisma.Decimal(dto.refundAmount)
          : isRefund
            ? await netOrderCash(order.id, tx)
            : new Prisma.Decimal(0);

      await recordOrderRefund(
        order,
        refund,
        isRefund
          ? `Refund pesanan ${order.orderId}`
          : `Pengembalian dana pembatalan pesanan ${order.orderId}`,
        tx,
      );

      return tx.order.findUniqueOrThrow({ where: { id: order.id } });
    });

    return {
      orderId: updated.orderId,
      status: updated.status,
      totalAmount: String(updated.totalAmount),
      dpAmount: updated.dpAmount ? String(updated.dpAmount) : null,
      /// Pesanan tertutup tidak punya tagihan lagi.
      remainingAmount: '0',
    };
  }

  /**
   * Pembatalan massal dari daftar pesanan.
   *
   * Hanya untuk pesanan yang masih Mengajukan — belum ada uang masuk dan
   * stoknya belum dikunci, jadi membatalkannya tidak meninggalkan apa-apa.
   * Pesanan yang sudah DP atau Lunas perlu nominal pengembalian dan
   * mengembalikan stok, jadi dibatalkan satu per satu lewat dialog pesanan.
   */
  async cancel(orderId: string[]) {
    const blocked = await prisma.order.findMany({
      where: {
        orderId: { in: orderId },
        status: { not: OrderStatus.PENDING },
      },
      select: { orderId: true, status: true },
    });

    if (blocked.length > 0) {
      throw new BadRequestException(
        `Pembatalan massal hanya untuk pesanan berstatus Mengajukan. Batalkan pesanan berikut lewat dialog pesanan supaya uang dan stoknya ikut diurus: ${blocked
          .map((row) => `${row.orderId} (${STATUS_LABEL[row.status]})`)
          .join(', ')}`,
      );
    }

    return prisma.order.updateMany({
      where: { orderId: { in: orderId }, status: OrderStatus.PENDING },
      data: { status: OrderStatus.CANCELLED },
    });
  }

  async getTotalAmount() {
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const totalAmount = await prisma.order.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const total = await prisma.order.count();
    const result = {
      totalAmount: totalAmount._sum.totalAmount ?? 0,
      totalOrder: total,
    };
    return result;
  }

  /// Tanpa paginasi: filternya sama dengan listing, seluruh baris ikut terbawa.
  async exportWorkbook(query: OrderQueryDto) {
    const rows = await prisma.order.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        buyerName: true,
        customer: { select: { name: true } },
        store: { select: { name: true } },
        payment: { select: { name: true } },
        user: { select: { employees: { select: { name: true } } } },
        shipment: {
          select: {
            courier: true,
            trackingNumber: true,
            shippingCost: true,
          },
        },
      },
    });

    const buffer = await buildWorkbook([
      {
        name: 'Pesanan Online',
        columns: [
          { header: 'Tanggal', key: 'createdAt', width: 14 },
          { header: 'Nomor pesanan', key: 'orderId', width: 22 },
          { header: 'Pelanggan', key: 'customer', width: 26 },
          { header: 'Toko', key: 'store', width: 20 },
          { header: 'Status', key: 'status', width: 14 },
          { header: 'Metode bayar', key: 'payment', width: 18 },
          { header: 'Diproses oleh', key: 'handler', width: 22 },
          { header: 'Kurir', key: 'courier', width: 16 },
          { header: 'No. resi', key: 'tracking', width: 22 },
          { header: 'Ongkir', key: 'shipping', money: true },
          { header: 'Total', key: 'total', money: true },
        ],
        rows: rows.map((row) => ({
          createdAt: row.createdAt.toISOString().slice(0, 10),
          orderId: row.orderId,
          /// Pesanan tamu tidak punya baris Customer; namanya diambil dari
          /// kontak yang diisi sendiri, sama seperti di daftar pesanan.
          customer: row.customer?.name ?? row.buyerName ?? '-',
          store: row.store?.name ?? '-',
          status: row.status,
          payment: row.payment?.name ?? '-',
          handler: row.user?.employees?.name ?? '-',
          courier: row.shipment?.courier ?? '-',
          tracking: row.shipment?.trackingNumber ?? '-',
          /// Key-nya sengaja tidak ditulis untuk pesanan ambil di tempat:
          /// `buildWorkbook` melewati kolom yang key-nya tidak ada, jadi
          /// selnya kosong — bukan Rp 0 yang seolah-olah ongkirnya gratis.
          ...(row.shipment && {
            shipping: row.shipment.shippingCost.toString(),
          }),
          total: row.totalAmount.toString(),
        })),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename(
        'pesanan-online',
        query.dateFrom,
        query.dateTo,
      ),
    };
  }
}
