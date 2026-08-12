import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { LOW_STOCK_THRESHOLD } from '@repo/schemas';

@Injectable()
export class InventoryLedgerService {
  async findAll(
    pagination: Pagination,
    params: {
      search?: string;
      itemType?: string;
      direction?: string;
      source?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const conditions: Prisma.Sql[] = [];
    if (params.search) {
      conditions.push(Prisma.sql` "itemName" ILIKE ${`%${params.search}%`} `);
    }

    if (params.itemType) {
      conditions.push(Prisma.sql` "itemType" = ${params.itemType} `);
    }

    if (params.direction) {
      conditions.push(Prisma.sql` direction = ${params.direction} `);
    }

    if (params.source) {
      conditions.push(Prisma.sql` source = ${params.source} `);
    }

    if (params.dateFrom) {
      conditions.push(
        Prisma.sql` "createdAt" >= ${toStartOfDay(params.dateFrom)} `,
      );
    }

    if (params.dateTo) {
      conditions.push(
        Prisma.sql` "createdAt" <= ${toEndOfDay(params.dateTo)} `,
      );
    }

    const whereCondition =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    const data = await prisma.$queryRaw<
      {
        id: bigint;
        itemName: string;
      }[]
    >`
    WITH custom_inventory_ledger AS (
        SELECT 
            l.id, s.name, l."itemType", l.direction, 
            l.source, l.quantity, l."referenceId", l."createdAt",
            CASE
                WHEN l."itemType" = 'PRODUCT_VARIANT' THEN pm.name || ' - ' || pv.sku
            END AS "itemName"
        FROM inventory_ledger l
        LEFT JOIN store s ON l."storeId" = s.id
        LEFT JOIN product_variant pv ON l."itemId" = pv.id AND l."itemType" = 'PRODUCT_VARIANT'
        LEFT JOIN product_master pm ON pv."productMasterId" = pm.id
    )
    SELECT * FROM custom_inventory_ledger
    ${whereCondition}
    ORDER BY "createdAt" DESC
    LIMIT ${pagination.limit} OFFSET ${pagination.skip}
    `;

    type CountResult = {
      count: bigint;
    };

    const countData = await prisma.$queryRaw<CountResult[]>`
    WITH custom_inventory_ledger AS ( 
        SELECT 
            l.id, s.name, l."itemType", l.direction, 
            l.source, l.quantity, l."referenceId", l."createdAt",
            CASE
                WHEN l."itemType" = 'PRODUCT_VARIANT' THEN pm.name || ' - ' || pv.sku
            END AS "itemName"
        FROM inventory_ledger l
        LEFT JOIN store s ON l."storeId" = s.id
        LEFT JOIN product_variant pv ON l."itemId" = pv.id AND l."itemType" = 'PRODUCT_VARIANT'
        LEFT JOIN product_master pm ON pv."productMasterId" = pm.id
     )
    SELECT COUNT(*)::integer as count FROM custom_inventory_ledger
    ${whereCondition}
    `;

    const total = countData[0]?.count ? Number(countData[0].count) : 0;

    return {
      success: true,
      data: data,
      meta: {
        skip: pagination.skip ?? 0,
        limit: pagination.limit ?? 10,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Varian yang stoknya sudah menipis.
   *
   * Tiga hal yang menentukan bentuk query ini:
   *
   * 1. **Dasar hitungnya `stock`, bukan `stock - reserved_stock`.** `stock` di
   *    basis kode ini sudah bersih karena penjualan POS dan checkout online
   *    langsung men-decrement-nya. `reserved_stock` ikut di-increment pada
   *    operasi yang sama tapi tidak pernah dikembalikan, jadi mengurangkannya
   *    berarti menghitung penjualan dua kali. Lihat catatan di `LowStockData`.
   * 2. **Produk nonaktif dan draft dikecualikan.** Peringatan stok untuk barang
   *    yang sudah tidak dijual hanya jadi kebisingan yang menutupi yang penting.
   * 3. **Penyaringan dan paginasi sama-sama di SQL**, bukan di memori, supaya
   *    `total` tetap benar.
   */
  /// Dipakai listing, penghitung total, dan ekspor sekaligus — satu definisi
  /// "stok rendah" yang tidak bisa menyimpang antar ketiganya.
  private lowStockCondition(search?: string, storeId?: string) {
    const searchCondition = search
      ? Prisma.sql`AND (pm.name ILIKE ${`%${search}%`} OR pv.sku ILIKE ${`%${search}%`})`
      : Prisma.empty;

    /// Tanpa filter toko, seluruh toko ikut — satu varian bisa muncul beberapa
    /// kali kalau menipis di lebih dari satu tempat, dan memang begitulah yang
    /// perlu dilihat.
    const storeCondition = storeId
      ? Prisma.sql`AND st."storeId" = ${BigInt(storeId)}`
      : Prisma.empty;

    return Prisma.sql`
      WHERE st.stock < ${LOW_STOCK_THRESHOLD}
        AND pv."isActive" = true
        AND pm.status = 'ACTIVE'
        AND s."isActive" = true
        ${storeCondition}
        ${searchCondition}
    `;
  }

  async findLowStock(
    pagination: Pagination,
    search?: string,
    storeId?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const baseCondition = this.lowStockCondition(search, storeId);

    const data = await prisma.$queryRaw<
      {
        variantId: bigint;
        productId: bigint;
        storeId: bigint;
        storeName: string;
        productName: string;
        type: string;
        sku: string;
        variantLabel: string;
        stock: number;
        updatedAt: Date;
      }[]
    >`
      SELECT
          pv.id AS "variantId",
          pm.id AS "productId",
          s.id AS "storeId",
          s.name AS "storeName",
          pm.name AS "productName",
          pm.type,
          pv.sku,
          st.stock,
          st.updated_at AS "updatedAt",
          COALESCE(string_agg(vv.value, ' / ' ORDER BY vt.name), '') AS "variantLabel"
      FROM product_variant_stock st
      JOIN product_variant pv ON st."productVariantId" = pv.id
      JOIN product_master pm ON pv."productMasterId" = pm.id
      JOIN store s ON st."storeId" = s.id
      LEFT JOIN product_variant_option po ON po."productVariantId" = pv.id
      LEFT JOIN product_variant_value vv ON po."variantValueId" = vv.id
      LEFT JOIN product_variant_type vt ON vv."variantTypeId" = vt.id
      ${baseCondition}
      GROUP BY pv.id, pm.id, s.id, s.name, pm.name, pm.type, pv.sku, st.stock, st.updated_at
      ORDER BY st.stock ASC, s.name ASC, pm.name ASC
      LIMIT ${limit} OFFSET ${skip}
    `;

    /// Sengaja tanpa join ke tabel opsi varian: join itu melipatgandakan baris
    /// per varian dan hanya dibutuhkan untuk menyusun label, bukan untuk menghitung.
    /// Join ke `store` tetap ada karena kondisinya menyaring toko aktif.
    const countData = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::integer AS count
      FROM product_variant_stock st
      JOIN product_variant pv ON st."productVariantId" = pv.id
      JOIN product_master pm ON pv."productMasterId" = pm.id
      JOIN store s ON st."storeId" = s.id
      ${baseCondition}
    `;

    const total = countData[0]?.count ? Number(countData[0].count) : 0;

    return {
      success: true,
      data: data.map((item) => ({
        ...item,
        updatedAt: item.updatedAt.toISOString(),
      })),
      meta: {
        skip,
        limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }


  async getSummary() {
    const stockFlow = await prisma.inventoryLedger.groupBy({
      by: ['direction'],
      _sum: {
        quantity: true,
      },
    });

    const historyByType = await prisma.inventoryLedger.groupBy({
      by: ['itemType'],
      _count: {
        _all: true,
      },
    });

    const result = {
      stockFlow: {
        totalIn:
          stockFlow.find((item) => item.direction === 'IN')?._sum.quantity ?? 0,
        totalOut:
          stockFlow.find((item) => item.direction === 'OUT')?._sum.quantity ??
          0,
      },
      historyByType: {
        productVariant:
          historyByType.find((item) => item.itemType === 'PRODUCT_VARIANT')
            ?._count._all ?? 0,
      },
    };
    return result;
  }
}
