import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, prisma, ProductionStatus } from '@repo/db';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';
import { idFormat } from 'common/helpers/id-format';
import { findProductionHouse } from 'common/helpers/online-store';
import {
  CloseProductionDto,
  CreateProductionDto,
  ProductionQueryDto,
  RecordDeliveryDto,
} from 'production/dto/production.dto';
import {
  productionDetailInclude,
  productionListInclude,
  toProductionDetailResponse,
  toProductionResponse,
} from './productions.response';

/// Batch yang sudah tutup buku: isinya tidak boleh diubah maupun disetori.
const CLOSED_STATUSES: ProductionStatus[] = ['COMPLETED', 'CANCELLED'];

@Injectable()
export class ProductionService {
  /// Dipakai bersama listing dan ekspor, supaya berkas Excel tidak mungkin
  /// menyaring berbeda dari yang tampil di layar.
  private buildWhere(query: ProductionQueryDto): Prisma.ProductionWhereInput {
    return {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          {
            items: {
              some: {
                variant: {
                  OR: [
                    { sku: { contains: query.search, mode: 'insensitive' } },
                    {
                      productMaster: {
                        name: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      }),
      ...((query.dateFrom || query.dateTo) && {
        targetDate: {
          gte: query.dateFrom ? toStartOfDay(query.dateFrom) : undefined,
          lte: query.dateTo ? toEndOfDay(query.dateTo) : undefined,
        },
      }),
    };
  }

  async findAll(query: ProductionQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      prisma.production.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: productionListInclude,
      }),
      prisma.production.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toProductionResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async summary() {
    const grouped = await prisma.production.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countOf = (status: ProductionStatus) =>
      grouped.find((row) => row.status === status)?._count._all ?? 0;

    /**
     * Sisa target batch yang masih berjalan.
     *
     * Dihitung dari baris varian, bukan dari jumlah batch: pertanyaan yang
     * sebenarnya adalah "berapa pcs lagi yang belum jadi", dan satu batch
     * bisa berisi ratusan pcs lintas varian.
     */
    const outstanding = await prisma.productionItem.aggregate({
      where: { production: { status: { notIn: CLOSED_STATUSES } } },
      _sum: { targetQuantity: true, deliveredQuantity: true },
    });

    const target = outstanding._sum.targetQuantity ?? 0;
    const delivered = outstanding._sum.deliveredQuantity ?? 0;

    return {
      success: true,
      data: {
        planned: countOf('PLANNED'),
        inProgress: countOf('IN_PROGRESS'),
        completed: countOf('COMPLETED'),
        cancelled: countOf('CANCELLED'),
        outstandingQuantity: Math.max(target - delivered, 0),
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async findOne(id: bigint) {
    const data = await prisma.production.findUnique({
      where: { id },
      include: productionDetailInclude,
    });

    if (!data) throw new NotFoundException('Batch produksi tidak ditemukan');

    return {
      success: true,
      data: toProductionDetailResponse(data),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// Memastikan varian yang diminta benar-benar ada, supaya id ngawur dari
  /// permintaan langsung ke API tidak berakhir jadi galat kunci asing 500.
  private async assertVariantsExist(variantIds: bigint[]) {
    const found = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true },
    });

    if (found.length !== variantIds.length) {
      throw new BadRequestException(
        'Ada varian produk yang tidak ditemukan. Muat ulang halaman lalu pilih ulang.',
      );
    }
  }

  async create(data: CreateProductionDto) {
    const variantIds = data.items.map((item) => BigInt(item.productVariantId));
    await this.assertVariantsExist(variantIds);

    const created = await prisma.production.create({
      data: {
        code: idFormat('PRD'),
        status: 'PLANNED',
        targetDate: data.targetDate,
        notes: data.notes,
        items: {
          create: data.items.map((item) => ({
            productVariantId: BigInt(item.productVariantId),
            targetQuantity: item.targetQuantity,
          })),
        },
      },
      include: productionDetailInclude,
    });

    return {
      success: true,
      data: toProductionDetailResponse(created),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Mengubah isi batch.
   *
   * Daftar variannya diganti utuh mengikuti form, tapi baris yang sudah
   * pernah disetori tidak boleh hilang atau turun di bawah jumlah yang sudah
   * masuk — stok dan riwayatnya terlanjur bergerak.
   */
  async update(id: bigint, data: CreateProductionDto) {
    const isExisting = await prisma.production.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!isExisting) {
      throw new NotFoundException('Batch produksi tidak ditemukan');
    }

    if (CLOSED_STATUSES.includes(isExisting.status)) {
      throw new BadRequestException(
        'Batch yang sudah selesai atau dibatalkan tidak bisa diubah lagi',
      );
    }

    const variantIds = data.items.map((item) => BigInt(item.productVariantId));
    await this.assertVariantsExist(variantIds);

    const requested = new Map(
      data.items.map((item) => [
        String(item.productVariantId),
        item.targetQuantity,
      ]),
    );

    for (const item of isExisting.items) {
      if (item.deliveredQuantity === 0) continue;

      const nextTarget = requested.get(String(item.productVariantId));

      if (nextTarget === undefined) {
        throw new BadRequestException(
          'Varian yang sudah pernah disetor tidak bisa dihapus dari batch. Batalkan setorannya dulu kalau memang salah.',
        );
      }

      if (nextTarget < item.deliveredQuantity) {
        throw new BadRequestException(
          `Target varian tidak boleh lebih kecil dari yang sudah masuk (${item.deliveredQuantity} pcs).`,
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      /// Baris yang tidak lagi ada di form dibuang; yang tersisa di-upsert
      /// supaya `deliveredQuantity`-nya tidak ikut hilang.
      await tx.productionItem.deleteMany({
        where: { productionId: id, productVariantId: { notIn: variantIds } },
      });

      for (const item of data.items) {
        await tx.productionItem.upsert({
          where: {
            productionId_productVariantId: {
              productionId: id,
              productVariantId: BigInt(item.productVariantId),
            },
          },
          update: { targetQuantity: item.targetQuantity },
          create: {
            productionId: id,
            productVariantId: BigInt(item.productVariantId),
            targetQuantity: item.targetQuantity,
          },
        });
      }

      return tx.production.update({
        where: { id },
        data: { targetDate: data.targetDate, notes: data.notes },
        include: productionDetailInclude,
      });
    });

    return {
      success: true,
      data: toProductionDetailResponse(updated),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Mencatat satu kali antar hasil produksi.
   *
   * Sekali jalan: stok rumah produksi bertambah, riwayat stok mencatat barang
   * masuk, kemajuan batch naik, dan statusnya bergerak sendiri. Acuan riwayat
   * stok tetap batch-nya (bukan setorannya) supaya sebentuk dengan data lama.
   */
  async recordDelivery(id: bigint, data: RecordDeliveryDto, actor: JwtPayload) {
    const batch = await prisma.production.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!batch) throw new NotFoundException('Batch produksi tidak ditemukan');

    if (CLOSED_STATUSES.includes(batch.status)) {
      throw new BadRequestException(
        'Batch yang sudah selesai atau dibatalkan tidak bisa disetori lagi',
      );
    }

    const lines = data.items.filter((item) => item.quantity > 0);
    const itemById = new Map(
      batch.items.map((item) => [String(item.id), item]),
    );

    for (const line of lines) {
      const item = itemById.get(String(line.productionItemId));

      if (!item) {
        throw new BadRequestException(
          'Ada varian yang bukan bagian dari batch ini. Muat ulang halaman lalu coba lagi.',
        );
      }

      const sisa = item.targetQuantity - item.deliveredQuantity;
      if (line.quantity > sisa) {
        throw new BadRequestException(
          `Jumlah yang disetor melebihi sisa target (sisa ${sisa} pcs). Kalau targetnya memang bertambah, ubah dulu batch-nya.`,
        );
      }
    }

    const productionHouse = await findProductionHouse();

    await prisma.$transaction(async (tx) => {
      const delivery = await tx.productionDelivery.create({
        data: {
          productionId: id,
          deliveredAt: data.deliveredAt,
          note: data.note,
          userId: BigInt(actor.sub),
          items: {
            create: lines.map((line) => ({
              productionItemId: BigInt(line.productionItemId),
              quantity: line.quantity,
            })),
          },
        },
      });

      for (const line of lines) {
        const item = itemById.get(String(line.productionItemId))!;

        await tx.productionItem.update({
          where: { id: item.id },
          data: { deliveredQuantity: { increment: line.quantity } },
        });

        await tx.productVariantStock.upsert({
          where: {
            productVariantId_storeId: {
              productVariantId: item.productVariantId,
              storeId: productionHouse.id,
            },
          },
          update: { stock: { increment: line.quantity } },
          create: {
            productVariantId: item.productVariantId,
            storeId: productionHouse.id,
            stock: line.quantity,
            reserved_stock: 0,
          },
        });

        await tx.inventoryLedger.create({
          data: {
            storeId: productionHouse.id,
            itemType: 'PRODUCT_VARIANT',
            itemId: item.productVariantId,
            direction: 'IN',
            quantity: line.quantity,
            source: 'PRODUCTION',
            referenceId: id,
            createdAt: delivery.deliveredAt,
          },
        });
      }

      await this.syncBatchStatus(tx, id);
    });

    return this.findOne(id);
  }

  /**
   * Menyelaraskan status batch dengan kemajuannya.
   *
   * Statusnya memang tidak pernah diisi manual: belum ada yang masuk berarti
   * Direncanakan, sebagian masuk berarti Dikerjakan, dan semua target
   * terpenuhi berarti Selesai.
   */
  private async syncBatchStatus(tx: Prisma.TransactionClient, id: bigint) {
    const items = await tx.productionItem.findMany({
      where: { productionId: id },
      select: { targetQuantity: true, deliveredQuantity: true },
    });

    const delivered = items.reduce(
      (total, item) => total + item.deliveredQuantity,
      0,
    );
    const isComplete =
      items.length > 0 &&
      items.every((item) => item.deliveredQuantity >= item.targetQuantity);

    const status: ProductionStatus = isComplete
      ? 'COMPLETED'
      : delivered > 0
        ? 'IN_PROGRESS'
        : 'PLANNED';

    await tx.production.update({
      where: { id },
      data: {
        status,
        completedAt: isComplete ? new Date() : null,
      },
    });
  }

  /**
   * Membatalkan satu setoran yang salah input.
   *
   * Stoknya ditarik kembali, dan koreksinya dicatat sebagai barang keluar —
   * bukan dengan menghapus riwayat lamanya, supaya jejaknya tetap utuh.
   * Ditolak kalau stok bebasnya sudah tidak cukup, karena barangnya berarti
   * sudah terjual atau terkirim.
   */
  async cancelDelivery(id: bigint, deliveryId: bigint) {
    const delivery = await prisma.productionDelivery.findFirst({
      where: { id: deliveryId, productionId: id },
      include: { items: { include: { item: true } } },
    });

    if (!delivery) {
      throw new NotFoundException('Setoran tidak ditemukan pada batch ini');
    }

    const productionHouse = await findProductionHouse();

    const shortages: string[] = [];

    for (const row of delivery.items) {
      const stock = await prisma.productVariantStock.findUnique({
        where: {
          productVariantId_storeId: {
            productVariantId: row.item.productVariantId,
            storeId: productionHouse.id,
          },
        },
        include: {
          productVariant: {
            select: {
              sku: true,
              productMaster: { select: { name: true } },
            },
          },
        },
      });

      if (!stock || stock.stock < row.quantity) {
        shortages.push(
          `${stock?.productVariant.productMaster.name ?? 'Varian'} (${stock?.productVariant.sku ?? '-'}): perlu ${row.quantity}, stok bebas ${stock?.stock ?? 0}`,
        );
      }
    }

    if (shortages.length > 0) {
      throw new BadRequestException(
        `Setoran tidak bisa dibatalkan karena stoknya sudah tidak utuh: ${shortages.join(', ')}. Barangnya kemungkinan sudah terjual atau dikirim.`,
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const row of delivery.items) {
        await tx.productionItem.update({
          where: { id: row.productionItemId },
          data: { deliveredQuantity: { decrement: row.quantity } },
        });

        await tx.productVariantStock.update({
          where: {
            productVariantId_storeId: {
              productVariantId: row.item.productVariantId,
              storeId: productionHouse.id,
            },
          },
          data: { stock: { decrement: row.quantity } },
        });

        await tx.inventoryLedger.create({
          data: {
            storeId: productionHouse.id,
            itemType: 'PRODUCT_VARIANT',
            itemId: row.item.productVariantId,
            direction: 'OUT',
            quantity: row.quantity,
            source: 'PRODUCTION',
            referenceId: id,
          },
        });
      }

      await tx.productionDelivery.delete({ where: { id: deliveryId } });
      await this.syncBatchStatus(tx, id);
    });

    return this.findOne(id);
  }

  /**
   * Menutup batch sebelum targetnya terpenuhi.
   *
   * Sisa targetnya bisa langsung dipindahkan ke batch lanjutan — sesuai cara
   * kerjanya di lapangan: yang belum jadi dikerjakan di periode berikutnya,
   * bukan hilang begitu saja.
   */
  async close(id: bigint, data: CloseProductionDto) {
    const batch = await prisma.production.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!batch) throw new NotFoundException('Batch produksi tidak ditemukan');

    if (CLOSED_STATUSES.includes(batch.status)) {
      throw new BadRequestException('Batch ini sudah ditutup');
    }

    const leftovers = batch.items
      .map((item) => ({
        productVariantId: item.productVariantId,
        remaining: item.targetQuantity - item.deliveredQuantity,
      }))
      .filter((item) => item.remaining > 0);

    const hasDelivery = batch.items.some((item) => item.deliveredQuantity > 0);

    const result = await prisma.$transaction(async (tx) => {
      /// Belum ada satu pun yang masuk berarti batch ini batal, bukan
      /// selesai — menandainya "Selesai" akan berbohong di laporan.
      await tx.production.update({
        where: { id },
        data: {
          status: hasDelivery ? 'COMPLETED' : 'CANCELLED',
          completedAt: hasDelivery ? new Date() : null,
        },
      });

      if (!data.createContinuation || leftovers.length === 0) return null;

      return tx.production.create({
        data: {
          code: idFormat('PRD'),
          status: 'PLANNED',
          targetDate: batch.targetDate,
          notes: `Lanjutan sisa batch ${batch.code}`,
          parentProductionId: batch.id,
          items: {
            create: leftovers.map((item) => ({
              productVariantId: item.productVariantId,
              targetQuantity: item.remaining,
            })),
          },
        },
        select: { id: true, code: true },
      });
    });

    return {
      success: true,
      data: {
        closed: batch.code,
        continuationCode: result?.code ?? null,
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async remove(id: bigint) {
    const batch = await prisma.production.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!batch) throw new NotFoundException('Batch produksi tidak ditemukan');

    /// Batch yang pernah disetori sudah menggerakkan stok; menghapusnya akan
    /// membuat riwayat stok menunjuk batch yang tidak ada.
    if (batch.items.some((item) => item.deliveredQuantity > 0)) {
      throw new BadRequestException(
        'Batch yang sudah punya setoran tidak bisa dihapus. Tutup batch-nya saja.',
      );
    }

    await prisma.production.delete({ where: { id } });

    return {
      success: true,
      data: { id },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// Tanpa paginasi: filternya sama dengan listing, seluruh baris ikut.
  /// Satu baris per varian, karena itulah satuan yang dikerjakan.
  async exportWorkbook(query: ProductionQueryDto) {
    const rows = await prisma.production.findMany({
      where: this.buildWhere(query),
      orderBy: { createdAt: 'desc' },
      include: productionListInclude,
    });

    const buffer = await buildWorkbook([
      {
        name: 'Produksi',
        columns: [
          { header: 'Kode batch', key: 'code', width: 22 },
          { header: 'Status', key: 'status', width: 16 },
          { header: 'Target selesai', key: 'targetDate', width: 16 },
          { header: 'Produk', key: 'product', width: 32 },
          { header: 'Varian', key: 'variant', width: 20 },
          { header: 'SKU', key: 'sku', width: 20 },
          { header: 'Target', key: 'target' },
          { header: 'Sudah masuk', key: 'delivered' },
          { header: 'Sisa', key: 'remaining' },
          { header: 'Catatan', key: 'notes', width: 30 },
        ],
        rows: rows.flatMap((batch) =>
          batch.items.map((item) => ({
            code: batch.code,
            status: batch.status,
            targetDate: batch.targetDate.toISOString().slice(0, 10),
            product: item.variant.productMaster.name,
            variant: item.variant.options
              .map((option) => option.variantValue.value)
              .join(' - '),
            sku: item.variant.sku,
            target: item.targetQuantity,
            delivered: item.deliveredQuantity,
            remaining: Math.max(
              item.targetQuantity - item.deliveredQuantity,
              0,
            ),
            notes: batch.notes ?? '-',
          })),
        ),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename('produksi', query.dateFrom, query.dateTo),
    };
  }
}
