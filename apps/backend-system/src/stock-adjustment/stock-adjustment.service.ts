import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { idFormat } from 'common/helpers/id-format';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import { StockAdjustmentDto } from 'stock-adjustment/dto/stock-adjustment.dto';

@Injectable()
export class StockAdjustmentService {
  /**
   * Daftar varian beserta stoknya di satu toko.
   *
   * Varian yang belum punya baris stok di toko itu tetap ditampilkan dengan
   * angka 0 — justru itulah keadaan yang paling sering perlu disesuaikan saat
   * sistem mulai dipakai.
   */
  async findRows(storeId: bigint, search?: string) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!store) throw new BadRequestException('Toko tidak ditemukan.');

    const variants = await prisma.productVariant.findMany({
      where: search
        ? {
            OR: [
              { sku: { contains: search, mode: 'insensitive' } },
              {
                productMaster: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : undefined,
      select: {
        id: true,
        sku: true,
        productMaster: { select: { name: true } },
        options: { select: { variantValue: { select: { value: true } } } },
        productVariantStocks: {
          where: { storeId },
          select: { stock: true, reserved_stock: true },
        },
      },
      orderBy: [{ productMaster: { name: 'asc' } }, { sku: 'asc' }],
    });

    return {
      success: true,
      data: {
        storeId: store.id,
        storeName: store.name,
        rows: variants.map((variant) => ({
          productVariantId: variant.id,
          productName: variant.productMaster.name,
          variantLabel: variant.options
            .map((option) => option.variantValue.value)
            .join(' - '),
          sku: variant.sku,
          stock: variant.productVariantStocks[0]?.stock ?? 0,
          reservedStock: variant.productVariantStocks[0]?.reserved_stock ?? 0,
        })),
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Menerapkan hasil hitung fisik.
   *
   * Yang dicatat hanya varian yang angkanya benar-benar berubah. Varian yang
   * diisi sama dengan stok sekarang dilewati, supaya riwayat stok tidak
   * dipenuhi baris bernilai nol yang menutupi perubahan sungguhan.
   */
  async apply(data: StockAdjustmentDto, storeId: bigint, actor: JwtPayload) {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true },
    });

    if (!store) throw new BadRequestException('Toko tidak ditemukan.');

    const variantIds = data.items.map((item) => BigInt(item.productVariantId));

    if (new Set(variantIds.map(String)).size !== variantIds.length) {
      throw new BadRequestException(
        'Ada varian yang sama dikirim lebih dari sekali.',
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        sku: true,
        productVariantStocks: {
          where: { storeId },
          select: { stock: true, reserved_stock: true },
        },
      },
    });

    if (variants.length !== variantIds.length) {
      throw new BadRequestException('Ada varian yang tidak ditemukan.');
    }

    const byId = new Map(
      variants.map((variant) => [String(variant.id), variant]),
    );

    const changes = data.items
      .map((item) => {
        const variant = byId.get(String(item.productVariantId))!;
        const previousStock = variant.productVariantStocks[0]?.stock ?? 0;
        const reserved = variant.productVariantStocks[0]?.reserved_stock ?? 0;

        /**
         * Stok tidak boleh turun di bawah yang sudah dikunci pesanan.
         *
         * Barang itu sudah dijanjikan ke pembeli yang membayar; menurunkannya
         * membuat pesanan yang sah tidak punya barang, dan selisihnya baru
         * ketahuan saat pesanan hendak dikirim.
         */
        if (item.countedStock < reserved) {
          throw new BadRequestException(
            `SKU ${variant.sku}: ${reserved} pcs sudah dikunci pesanan, jadi stok tidak bisa disetel di bawah angka itu.`,
          );
        }

        return {
          variantId: variant.id,
          previousStock,
          countedStock: item.countedStock,
          difference: item.countedStock - previousStock,
        };
      })
      .filter((change) => change.difference !== 0);

    if (changes.length === 0) {
      throw new BadRequestException(
        'Tidak ada angka yang berubah. Isi jumlah yang berbeda dari stok sekarang.',
      );
    }

    const adjustment = await prisma.$transaction(async (tx) => {
      const created = await tx.stockAdjustment.create({
        data: {
          code: idFormat('ADJ'),
          storeId: store.id,
          reason: data.reason,
          userId: BigInt(actor.sub),
          items: {
            create: changes.map((change) => ({
              productVariantId: change.variantId,
              previousStock: change.previousStock,
              countedStock: change.countedStock,
            })),
          },
        },
      });

      for (const change of changes) {
        /// upsert, bukan update: varian yang belum pernah punya baris stok di
        /// toko ini justru kasus yang paling umum saat stok awal diisi.
        await tx.productVariantStock.upsert({
          where: {
            productVariantId_storeId: {
              productVariantId: change.variantId,
              storeId: store.id,
            },
          },
          create: {
            productVariantId: change.variantId,
            storeId: store.id,
            stock: change.countedStock,
            reserved_stock: 0,
          },
          update: { stock: change.countedStock },
        });

        await tx.inventoryLedger.create({
          data: {
            storeId: store.id,
            itemType: 'PRODUCT_VARIANT',
            itemId: change.variantId,
            direction: change.difference > 0 ? 'IN' : 'OUT',
            quantity: Math.abs(change.difference),
            source: 'ADJUSTMENT',
            referenceId: created.id,
          },
        });
      }

      return created;
    });

    return {
      success: true,
      data: {
        id: adjustment.id,
        code: adjustment.code,
        storeName: store.name,
        changedCount: changes.length,
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
