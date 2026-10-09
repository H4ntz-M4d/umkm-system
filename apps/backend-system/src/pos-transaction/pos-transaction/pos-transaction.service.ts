import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PosStatus, Prisma, prisma } from '@repo/db';
import { idFormat } from 'common/helpers/id-format';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { toPosTransactionResponse } from './pos-transaction.response';
import { Pagination } from 'common/paginate/pagination';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { CloudinaryFolder } from 'cloudinary/dto/dto.cloudinary';
import { assertPaymentMethodForStore } from 'payment/payment/payment.service';
import { MidtransService } from 'midtrans/midtrans.service';

/// Varian yang stoknya jadi minus setelah pembayaran dicatat.
export type PosStockWarning = {
  productName: string;
  sku: string;
  stock: number;
};

@Injectable()
export class PosTransactionService {
  private readonly logger = new Logger(PosTransactionService.name);

  constructor(
    private cloudinaryService: CloudinaryService,
    private midtransService: MidtransService,
  ) {}
  /// Dipakai bersama listing dan ekspor, supaya berkas Excel menyaring persis
  /// sama dengan yang tampil di layar.
  private buildWhere(
    search?: string,
    paymentChannel?: string,
    storeId?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.PosTransactionWhereInput {
    return {
      ...(paymentChannel && {
        paymentMethod: {
          name: {
            contains: paymentChannel,
            mode: 'insensitive',
          },
        },
      }),
      ...(storeId && {
        storeId: BigInt(storeId),
      }),
      ...(status && {
        status: PosStatus[status as keyof typeof PosStatus],
      }),
      ...(search && {
        OR: [
          {
            users: {
              employees: {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
          {
            transId: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
      createdAt: {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      },
    };
  }

  async findMany(
    pagination: Pagination,
    search?: string,
    paymentChannel?: string,
    storeId?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const whereClause = this.buildWhere(
      search,
      paymentChannel,
      storeId,
      status,
      dateFrom,
      dateTo,
    );

    const data = await prisma.posTransaction.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              select: {
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
        paymentMethod: {
          select: {
            name: true,
            channel: true,
          },
        },
        users: {
          select: {
            employees: {
              select: {
                name: true,
              },
            },
          },
        },
        store: {
          select: {
            name: true,
          },
        },
      },
    });

    const total = await prisma.posTransaction.count({
      where: whereClause,
    });

    const result = data.map(toPosTransactionResponse);

    return {
      success: true,
      data: result,
      meta: {
        skip: pagination.skip ?? 0,
        limit: pagination.limit ?? 10,
        total: total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async getTotalAmount() {
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const totalAmount = await prisma.posTransaction.aggregate({
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

    const total = await prisma.posTransaction.count();
    const result = {
      totalAmount: totalAmount._sum.totalAmount ?? 0,
      totalTransaction: total,
    };

    return result;
  }

  /// Tanpa paginasi: filternya sama dengan listing, seluruh baris ikut terbawa.
  async exportWorkbook(
    search?: string,
    paymentChannel?: string,
    storeId?: string,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const rows = await prisma.posTransaction.findMany({
      where: this.buildWhere(
        search,
        paymentChannel,
        storeId,
        status,
        dateFrom,
        dateTo,
      ),
      orderBy: { createdAt: 'desc' },
      select: {
        transId: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        store: { select: { name: true } },
        paymentMethod: { select: { name: true } },
        users: { select: { employees: { select: { name: true } } } },
        _count: { select: { items: true } },
      },
    });

    const buffer = await buildWorkbook([
      {
        name: 'Transaksi Kasir',
        columns: [
          { header: 'Tanggal', key: 'createdAt', width: 14 },
          { header: 'Nomor transaksi', key: 'transId', width: 22 },
          { header: 'Kasir', key: 'cashier', width: 24 },
          { header: 'Toko', key: 'store', width: 20 },
          { header: 'Status', key: 'status', width: 14 },
          { header: 'Metode bayar', key: 'payment', width: 18 },
          { header: 'Jumlah item', key: 'itemCount', width: 14 },
          { header: 'Total', key: 'total', money: true },
        ],
        rows: rows.map((row) => ({
          createdAt: row.createdAt.toISOString().slice(0, 10),
          transId: row.transId,
          cashier: row.users?.employees?.name ?? '-',
          store: row.store?.name ?? '-',
          status: row.status,
          payment: row.paymentMethod?.name ?? '-',
          itemCount: row._count.items,
          total: row.totalAmount.toString(),
        })),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename('transaksi-kasir', dateFrom, dateTo),
    };
  }

  async findManyByParked() {
    const res = await prisma.posTransaction.findMany({
      where: {
        status: PosStatus.PARKED,
      },
      include: {
        items: {
          select: {
            productVariantId: true,
            quantity: true,
            price: true,
            variant: {
              select: {
                productMaster: {
                  select: {
                    name: true,
                  },
                },
                options: {
                  select: {
                    variantValue: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = res.map((r) => {
      return {
        transId: r.transId,
        status: r.status,
        itemTransaction: r.items.map((it) => {
          const variantOpt = it.variant.options
            .map((vo) => vo.variantValue.value)
            .join(' - ');
          return {
            productVariantId: it.productVariantId,
            price: it.price,
            qty: it.quantity,
            itemTransactionName: it.variant.productMaster.name,
            itemTransactionVariantOpt: variantOpt,
          };
        }),
      };
    });

    return result;
  }

  /// `storeId` diterima sebagai argumen, bukan dibaca dari `data`, karena toko
  /// transaksi ditentukan server dari token kasir — bukan dari body request.
  async paidOperation(
    data: CreatePosTransactionDto,
    posTx: bigint,
    tx: Prisma.TransactionClient,
    storeId: bigint,
  ) {
    await tx.inventoryLedger.createMany({
      data: data.itemTransaction.map((item) => ({
        itemType: 'PRODUCT_VARIANT',
        itemId: BigInt(item.productVariantId),
        source: 'POS',
        referenceId: BigInt(posTx),
        direction: 'OUT',
        quantity: item.quantity,
        storeId: storeId,
      })),
    });

    const totalAmount = data.itemTransaction
      .map((item) => item.price * item.quantity)
      .reduce((total, item) => total + item, 0);

    await tx.cashTransaction.create({
      data: {
        type: 'IN',
        source: 'POS',
        referenceId: posTx,
        amount: totalAmount,
        storeId: storeId,
      },
    });

    const warnings: PosStockWarning[] = [];

    for (const items of data.itemTransaction) {
      /**
       * Stok yang dikurangi adalah stok toko tempat transaksi terjadi.
       *
       * `upsert`, bukan `update`, dan TANPA menolak stok yang tidak cukup:
       * fungsi ini juga dipanggil saat pembayaran QRIS/transfer terkonfirmasi,
       * ketika uangnya SUDAH diterima. Menolak di titik itu tidak membatalkan
       * pembayaran — hanya membuat transaksi yang sudah dibayar tertinggal
       * PENDING dan webhook Midtrans gagal terus. Jadi stok boleh minus, dan
       * hasilnya dilaporkan sebagai peringatan. Pengecekan stok cukup untuk
       * penjualan biasa tetap ada di `upsert`, sebelum transaksi dibuat.
       *
       * Hanya `stock` yang dikurangi. `reserved_stock` dulu ikut ditambah di
       * setiap penjualan tanpa pernah dikurangi; kolom itu sekarang khusus stok
       * yang dikunci untuk pesanan online.
       */
      const result = await tx.productVariantStock.upsert({
        where: {
          productVariantId_storeId: {
            productVariantId: BigInt(items.productVariantId),
            storeId: storeId,
          },
        },
        update: {
          stock: {
            decrement: items.quantity,
          },
        },
        create: {
          productVariantId: BigInt(items.productVariantId),
          storeId: storeId,
          stock: -items.quantity,
          reserved_stock: 0,
        },
        select: {
          stock: true,
          productVariant: {
            select: { sku: true, productMaster: { select: { name: true } } },
          },
        },
      });

      if (result.stock < 0) {
        warnings.push({
          productName: result.productVariant.productMaster.name,
          sku: result.productVariant.sku,
          stock: result.stock,
        });
      }
    }

    if (warnings.length > 0) {
      this.logger.warn(
        `Stok minus setelah transaksi kasir #${posTx}: ${warnings
          .map((item) => `${item.sku}=${item.stock}`)
          .join(', ')}`,
      );
    }

    return warnings;
  }

  async upsert(
    data: CreatePosTransactionDto,
    storeId: bigint,
    cashierId: bigint,
  ) {
    const stocks = await prisma.productVariantStock.findMany({
      where: {
        /// Disaring ke toko transaksi. Tanpa ini, sejak stok dipegang per toko,
        /// pencocokan di bawah bisa mengambil baris milik cabang lain dan
        /// meloloskan penjualan atas stok yang tidak dimiliki toko ini.
        storeId,
        productVariantId: {
          in: data.itemTransaction.map((item) => BigInt(item.productVariantId)),
        },
      },
      select: {
        productVariantId: true,
        stock: true,
        productVariant: {
          select: {
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
    });

    for (const dataStock of data.itemTransaction) {
      const itemStock = stocks.find(
        (stock) =>
          stock.productVariantId === BigInt(dataStock.productVariantId),
      );

      /**
       * Varian yang belum pernah punya baris stok di toko ini dianggap stoknya 0.
       *
       * Dulu kasus itu lolos dari pengecekan (`itemStock && ...`), lalu
       * `productVariantStock.update` di paidOperation meledak dengan P2025 —
       * kasir hanya melihat pesan generik "Data tidak ditemukan".
       */
      if (!itemStock) {
        throw new BadRequestException(
          'Stok salah satu produk belum tersedia di toko ini. Muat ulang daftar produk kasir.',
        );
      }

      if (itemStock.stock < dataStock.quantity) {
        const variantNames = itemStock.productVariant.options
          .map((opt) => opt.variantValue.value)
          .join(' - ');

        throw new BadRequestException(
          `Maaf stock dari ${itemStock.productVariant.productMaster.name}${
            variantNames ? ` variant ${variantNames}` : ''
          } tidak mencukupi (sisa ${itemStock.stock})`,
        );
      }
    }

    /// Metode pembayaran diperiksa di sini, bukan hanya disaring di layar:
    /// permintaan bisa dikirim langsung ke API dengan id rekening milik toko
    /// lain, dan uangnya akan tercatat masuk ke rekening yang salah.
    if (data.paymentMethodId) {
      await assertPaymentMethodForStore(BigInt(data.paymentMethodId), storeId);
    }

    const statusMap: Record<string, PosStatus> = {
      PENDING: PosStatus.PENDING,
      PARKED: PosStatus.PARKED,
      PAID: PosStatus.PAID,
      CANCELLED: PosStatus.CANCELLED,
    };

    const status = statusMap[data.status] ?? PosStatus.PENDING;

    if (data.itemTransaction.length === 0)
      throw new BadRequestException(
        'Item transaksi kosong, tidak bisa melakukan transaksi',
      );

    const transaction = await prisma.$transaction(async (tx) => {
      const totalAmount = data.itemTransaction.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

      if (!data.transId) {
        const transId = idFormat('POS');
        const posTx = await tx.posTransaction.create({
          data: {
            transId: transId,
            storeId: storeId,
            cashierId: cashierId,
            paymentMethodId: data.paymentMethodId
              ? BigInt(data.paymentMethodId)
              : null,
            totalAmount: totalAmount,
            status: status,
            items: {
              create: data.itemTransaction.map((item) => ({
                productVariantId: BigInt(item.productVariantId),
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
              })),
            },
          },
          include: {
            paymentMethod: {
              select: {
                channel: true,
              },
            },
          },
        });

        if (posTx.paymentMethod?.channel === 'MIDTRANS') {
          const qris = await this.midtransService.createQris({
            transactionId: posTx.transId,
            amount: totalAmount,
          });

          return {
            ...posTx,
            qrString: String(qris.qrString),
            qrUrl: String(qris.qrUrl),
          };
        }

        if (status === 'PAID')
          await this.paidOperation(data, posTx.id, tx, storeId);

        return posTx;
      } else {
        const posTx = await tx.posTransaction.update({
          where: {
            transId: data.transId,
          },
          data: {
            storeId: storeId,
            cashierId: cashierId,
            paymentMethodId: data.paymentMethodId
              ? BigInt(data.paymentMethodId)
              : null,
            totalAmount: totalAmount,
            status: status,
          },
          include: {
            paymentMethod: {
              select: {
                channel: true,
              },
            },
          },
        });

        if (data.itemTransaction.length > 0) {
          const existingItems = await tx.posTransactionItem.findMany({
            where: {
              posTransactionId: posTx.id,
            },
          });

          const existingVariantIds = existingItems.map(
            (item) => item.productVariantId,
          );
          const incomingVariants = data.itemTransaction.map((item) =>
            BigInt(item.productVariantId),
          );

          const variantsToDelete = existingVariantIds.filter(
            (id) => !incomingVariants.includes(id),
          );
          if (variantsToDelete.length > 0) {
            await tx.posTransactionItem.deleteMany({
              where: {
                posTransactionId: posTx.id,
                productVariantId: { in: variantsToDelete },
              },
            });
          }

          const itemsToCreate = data.itemTransaction.filter(
            (item) =>
              !existingVariantIds.includes(BigInt(item.productVariantId)),
          );
          if (itemsToCreate.length > 0) {
            await tx.posTransactionItem.createMany({
              data: itemsToCreate.map((item) => ({
                posTransactionId: posTx.id,
                productVariantId: BigInt(item.productVariantId),
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
              })),
            });
          }

          const itemsToUpdate = data.itemTransaction.filter((item) =>
            existingVariantIds.includes(BigInt(item.productVariantId)),
          );
          for (const item of itemsToUpdate) {
            await tx.posTransactionItem.updateMany({
              where: {
                posTransactionId: posTx.id,
                productVariantId: BigInt(item.productVariantId),
              },
              data: {
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
              },
            });
          }
        }

        if (posTx.paymentMethod?.channel === 'MIDTRANS') {
          const qris = await this.midtransService.createQris({
            transactionId: posTx.transId,
            amount: totalAmount,
          });

          return {
            ...posTx,
            qrString: String(qris.qrString),
            qrUrl: String(qris.qrUrl),
          };
        }

        if (status === 'PAID')
          await this.paidOperation(data, posTx.id, tx, storeId);
        return posTx;
      }
    });

    return transaction;
  }

  /**
   * Konfirmasi pembayaran transfer bank lewat unggahan bukti.
   *
   * Dua hal yang dulu keliru dan diperbaiki di sini:
   * 1. Bukti pembayaran dan status Lunas ditulis di LUAR transaksi database
   *    (`prisma`, bukan `tx`). Kalau pencatatan stok/kas gagal, transaksi sudah
   *    telanjur Lunas dengan bukti tersimpan, tapi stok dan kasnya tidak.
   * 2. Tidak ada pengecekan status, sehingga bukti bisa diunggah lagi untuk
   *    transaksi yang sudah Lunas dan stok/kasnya diproses dua kali.
   */
  async uploadProodOfPayment(transPosId: bigint, file: Express.Multer.File) {
    const existingTrans = await prisma.posTransaction.findUnique({
      where: { id: transPosId },
      include: {
        items: true,
      },
    });

    if (!existingTrans || !existingTrans.paymentMethodId)
      throw new BadRequestException('Maaf terjadi kesalahan saat transaksi');

    if (existingTrans.status !== PosStatus.PENDING) {
      throw new BadRequestException(
        existingTrans.status === PosStatus.PAID
          ? 'Transaksi ini sudah lunas, bukti pembayaran tidak perlu diunggah lagi'
          : 'Transaksi ini tidak sedang menunggu pembayaran',
      );
    }

    const imageUrl = await this.cloudinaryService.uploadImage(
      file,
      CloudinaryFolder.PAYMENT_PROOF,
    );

    return prisma.$transaction(async (tx) => {
      /// Status dipindah dulu dan secara berkondisi: kalau dua unggahan tiba
      /// bersamaan, yang kedua mendapati `count` nol dan dihentikan sebelum
      /// menyentuh stok maupun kas.
      const claimed = await tx.posTransaction.updateMany({
        where: { id: existingTrans.id, status: PosStatus.PENDING },
        data: { status: PosStatus.PAID },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(
          'Status transaksi sudah berubah. Muat ulang untuk melihat keadaan terbaru.',
        );
      }

      await tx.transferPaymentDetail.create({
        data: {
          transactionId: existingTrans.id,
          paymentMethodId: existingTrans.paymentMethodId!,
          paymentProof: imageUrl,
          confirmedAt: new Date(),
        },
      });

      const dataPosTrans: CreatePosTransactionDto = {
        cashierId: String(existingTrans.cashierId),
        storeId: String(existingTrans.storeId),
        transId: existingTrans.transId,
        paymentMethodId: String(existingTrans.paymentMethodId),
        status: PosStatus.PAID,
        itemTransaction: existingTrans.items.map((item) => ({
          price: Number(item.price),
          productVariantId: String(item.productVariantId),
          quantity: item.quantity,
        })),
      };

      const stockWarnings = await this.paidOperation(
        dataPosTrans,
        existingTrans.id,
        tx,
        existingTrans.storeId,
      );

      const result = await tx.posTransaction.findUniqueOrThrow({
        where: { id: existingTrans.id },
      });

      return { ...result, stockWarnings };
    });
  }

  /**
   * Dipolling layar QRIS kasir. Selain status, ikut melaporkan varian yang
   * stoknya minus di toko transaksi — pelunasan QRIS dicatat lewat webhook
   * tanpa ada kasir yang menunggu responsnya, jadi di sinilah peringatannya
   * bisa sampai ke layar.
   */
  async cekStatusTransaction(transPosId: bigint) {
    const transaction = await prisma.posTransaction.findUnique({
      where: { id: transPosId },
      select: {
        status: true,
        storeId: true,
        items: { select: { productVariantId: true } },
      },
    });

    if (!transaction) return null;

    if (transaction.status !== PosStatus.PAID) {
      return { status: transaction.status, stockWarnings: [] };
    }

    const negative = await prisma.productVariantStock.findMany({
      where: {
        storeId: transaction.storeId,
        productVariantId: {
          in: transaction.items.map((item) => item.productVariantId),
        },
        stock: { lt: 0 },
      },
      select: {
        stock: true,
        productVariant: {
          select: { sku: true, productMaster: { select: { name: true } } },
        },
      },
    });

    return {
      status: transaction.status,
      stockWarnings: negative.map((row) => ({
        productName: row.productVariant.productMaster.name,
        sku: row.productVariant.sku,
        stock: row.stock,
      })),
    };
  }

  /* eslint-disable */
  async handleMidtransWebHook(body: any) {
    // Verifikasi signature — pastikan request dari Midtrans asli
    const isValid = this.midtransService.verifyWebhookSignature({
      orderId: body.order_id,
      statusCode: body.status_code,
      grossAmount: body.gross_amount,
      signature: body.signature_key,
    });

    if (!isValid) throw new UnauthorizedException('Invalid signature');

    // Cek status dari Midtrans
    const isSuccess =
      body.transaction_status === 'settlement' ||
      body.transaction_status === 'capture';

    if (!isSuccess) return { received: true }; // abaikan status lain

    // Update transaksi ke PAID
    const transaction = await prisma.posTransaction.findUnique({
      where: { transId: body.order_id },
      include: { items: true },
    });

    if (!transaction || transaction.status === 'PAID') {
      return { received: true }; // idempotent — sudah selesai
    }

    await prisma.$transaction(async (tx) => {
      /// Dipindah secara berkondisi: Midtrans bisa mengirim notifikasi yang sama
      /// beberapa kali beruntun. Yang datang belakangan mendapati `count` nol
      /// dan berhenti sebelum stok maupun kas diproses dua kali.
      const claimed = await tx.posTransaction.updateMany({
        where: { id: transaction.id, status: { not: PosStatus.PAID } },
        data: { status: PosStatus.PAID },
      });

      if (claimed.count === 0) return;

      const dataStatus = { status: PosStatus.PAID };

      const dataPosTrans: CreatePosTransactionDto = {
        cashierId: String(transaction.cashierId),
        storeId: String(transaction.storeId),
        transId: transaction.transId,
        paymentMethodId: transaction.paymentMethodId
          ? String(transaction.paymentMethodId)
          : null,
        status: transaction.status,
        itemTransaction: transaction.items.map((item) => {
          return {
            price: Number(item.price),
            productVariantId: String(item.productVariantId),
            quantity: item.quantity,
          };
        }),
      };

      if (dataStatus.status === 'PAID')
        await this.paidOperation(
          dataPosTrans,
          transaction.id,
          tx,
          transaction.storeId,
        );
    });

    return { received: true };
  }
  /* eslint-enable */

  /**
   * Membatalkan transaksi QRIS yang ditinggal kasir.
   *
   * Dipanggil saat dialog pembayaran ditutup atau QR dibuat ulang. Tanpa ini,
   * QR lama tetap bisa dibayar sampai masa berlakunya habis; kalau kasir sudah
   * beralih ke tunai, barang yang sama terbayar dua kali dan tercatat terjual
   * dua kali.
   *
   * Dibatalkan juga DI MIDTRANS, bukan cuma di database kita — status lokal
   * tidak menghentikan siapa pun memindai QR yang sudah tercetak di layar.
   *
   * Kalau ternyata pembayarannya sudah masuk, transaksi TIDAK dibatalkan:
   * uangnya nyata, jadi dibiarkan diselesaikan webhook.
   */
  async abandonQrisTransaction(transPosId: bigint) {
    const transaction = await prisma.posTransaction.findUnique({
      where: { id: transPosId },
      select: {
        id: true,
        transId: true,
        status: true,
        paymentMethod: { select: { channel: true } },
      },
    });

    if (!transaction)
      throw new BadRequestException('Transaksi tidak ditemukan');

    if (transaction.status === PosStatus.PAID) {
      return { cancelled: false, reason: 'PAID' as const };
    }

    if (transaction.status === PosStatus.CANCELLED) {
      return { cancelled: true, reason: 'ALREADY_CANCELLED' as const };
    }

    if (transaction.paymentMethod?.channel === 'MIDTRANS') {
      const cancelledAtMidtrans = await this.midtransService.cancelTransaction(
        transaction.transId,
      );

      /// Midtrans menolak pembatalan antara lain ketika pembayarannya sudah
      /// masuk. Statusnya ditanyakan supaya pembayaran yang sah tidak ikut
      /// dibatalkan secara lokal.
      if (!cancelledAtMidtrans) {
        const status = await this.midtransService
          .getTransactionStatus(transaction.transId)
          .catch(() => null);

        if (
          status?.transactionStatus === 'settlement' ||
          status?.transactionStatus === 'capture'
        ) {
          this.logger.warn(
            `Transaksi ${transaction.transId} sudah dibayar saat hendak dibatalkan — dibiarkan untuk diselesaikan webhook.`,
          );
          return { cancelled: false, reason: 'PAID' as const };
        }
      }
    }

    const claimed = await prisma.posTransaction.updateMany({
      where: { id: transaction.id, status: PosStatus.PENDING },
      data: { status: PosStatus.CANCELLED },
    });

    return {
      cancelled: claimed.count > 0,
      reason: claimed.count > 0 ? ('CANCELLED' as const) : ('CHANGED' as const),
    };
  }

  /**
   * Membatalkan transaksi kasir yang BELUM dibayar.
   *
   * Dulu status apa pun langsung diubah jadi CANCELLED, termasuk transaksi yang
   * sudah PAID — padahal stoknya sudah dikurangi dan kasnya sudah tercatat
   * masuk, dan pembatalan tidak mengembalikan keduanya. Transaksi lunas yang
   * perlu dikoreksi butuh alur retur tersendiri, bukan pembatalan.
   *
   * Seluruh permintaan ditolak kalau ada satu saja yang tidak boleh dibatalkan,
   * supaya kasir tidak mendapati sebagian batal dan sebagian tidak tanpa tahu
   * yang mana.
   */
  async cancelTransaction(transactionId: string[]) {
    const cancellable: PosStatus[] = [PosStatus.PENDING, PosStatus.PARKED];

    return prisma.$transaction(async (tx) => {
      const found = await tx.posTransaction.findMany({
        where: { transId: { in: transactionId } },
        select: { transId: true, status: true },
      });

      const missing = transactionId.filter(
        (id) => !found.some((item) => item.transId === id),
      );
      if (missing.length > 0) {
        throw new BadRequestException(
          `Transaksi tidak ditemukan: ${missing.join(', ')}`,
        );
      }

      const paid = found.filter((item) => item.status === PosStatus.PAID);
      if (paid.length > 0) {
        throw new BadRequestException(
          `Transaksi yang sudah dibayar tidak bisa dibatalkan: ${paid
            .map((item) => item.transId)
            .join(', ')}`,
        );
      }

      /// Status ikut disaring saat update, bukan cuma dicek di atas: kalau
      /// pembayaran QRIS masuk di antara pengecekan dan update, transaksi itu
      /// tidak ikut terbatalkan. Yang sudah CANCELLED dilewati tanpa galat.
      return tx.posTransaction.updateMany({
        where: {
          transId: { in: transactionId },
          status: { in: cancellable },
        },
        data: { status: PosStatus.CANCELLED },
      });
    });
  }
}
