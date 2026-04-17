import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';

@Injectable()
export class InventoryLedgerService {
  async findAll(
    pagination: Pagination,
    params: {
      search?: string;
      itemType?: string;
      direction?: string;
      source?: string;
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
                WHEN l."itemType" = 'RAW_MATERIAL' THEN rm.name
            END AS "itemName"
        FROM inventory_ledger l
        LEFT JOIN store s ON l."storeId" = s.id
        LEFT JOIN product_variant pv ON l."itemId" = pv.id AND l."itemType" = 'PRODUCT_VARIANT'
        LEFT JOIN product_master pm ON pv."productMasterId" = pm.id
        LEFT JOIN raw_material rm ON l."itemId" = rm.id AND l."itemType" = 'RAW_MATERIAL'
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
                WHEN l."itemType" = 'RAW_MATERIAL' THEN rm.name
            END AS "itemName"
        FROM inventory_ledger l
        LEFT JOIN store s ON l."storeId" = s.id
        LEFT JOIN product_variant pv ON l."itemId" = pv.id AND l."itemType" = 'PRODUCT_VARIANT'
        LEFT JOIN product_master pm ON pv."productMasterId" = pm.id
        LEFT JOIN raw_material rm ON l."itemId" = rm.id AND l."itemType" = 'RAW_MATERIAL'
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
        rawMaterial:
          historyByType.find((item) => item.itemType === 'RAW_MATERIAL')?._count
            ._all ?? 0,
      },
    };
    return result;
  }
}
