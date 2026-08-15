import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import type { ReportsQueryInput, TopProductsQueryInput } from '@repo/schemas';
import {
  DateWindow,
  expenseTotal,
  onlineRevenue,
  orderStoreFilter,
  paidOrderCondition,
  paidPosCondition,
  posRevenue,
  posStoreFilter,
  resolveReportRange,
} from './reports.revenue';

const DEFAULT_TOP_PRODUCTS = 10;

/// Bucketing bulanan memakai konvensi yang sama dengan dashboard: geser ke WIB
/// dulu baru dipotong, supaya transaksi larut malam tidak jatuh ke bulan lain.
const WIB_SHIFT = Prisma.sql`+ INTERVAL '7 hours'`;

function toMonthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

/// Bulan tanpa transaksi tetap harus muncul sebagai nol, kalau tidak grafik
/// batangnya bolong dan terbaca seolah bulan itu tidak ada.
function monthKeysBetween(dateFrom: string, dateTo: string): string[] {
  const [fromYear, fromMonth] = dateFrom.split('-').map(Number);
  const [toYear, toMonth] = dateTo.split('-').map(Number);

  const keys: string[] = [];
  let cursor = new Date(Date.UTC(fromYear, (fromMonth ?? 1) - 1, 1));
  const last = new Date(Date.UTC(toYear, (toMonth ?? 1) - 1, 1));

  while (cursor <= last) {
    keys.push(toMonthKey(cursor));
    cursor = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1),
    );
  }

  return keys;
}

function toMonthMap(rows: { bucket: Date; total: string }[]) {
  return new Map(rows.map((row) => [toMonthKey(row.bucket), row.total]));
}

@Injectable()
export class ReportsService {
  async summary(query: ReportsQueryInput) {
    const range = resolveReportRange(query);

    const [
      posCurrent,
      onlineCurrent,
      expenseCurrent,
      posPrevious,
      onlinePrevious,
      expensePrevious,
    ] = await Promise.all([
      posRevenue(range, query.storeId),
      onlineRevenue(range, query.storeId),
      expenseTotal(range, query.storeId),
      posRevenue(range.previous, query.storeId),
      onlineRevenue(range.previous, query.storeId),
      expenseTotal(range.previous, query.storeId),
    ]);

    /// Penjumlahan uang lewat Decimal, bukan float.
    const sum = (a: string, b: string) =>
      new Prisma.Decimal(a).add(new Prisma.Decimal(b));
    const revenueCurrent = sum(posCurrent, onlineCurrent);
    const revenuePrevious = sum(posPrevious, onlinePrevious);

    return {
      success: true,
      data: {
        range: { dateFrom: range.dateFrom, dateTo: range.dateTo },
        previousRange: {
          dateFrom: range.previous.dateFrom,
          dateTo: range.previous.dateTo,
        },
        revenue: {
          current: revenueCurrent.toString(),
          previous: revenuePrevious.toString(),
        },
        revenuePos: { current: posCurrent, previous: posPrevious },
        revenueOnline: { current: onlineCurrent, previous: onlinePrevious },
        expense: { current: expenseCurrent, previous: expensePrevious },
        balance: {
          current: revenueCurrent
            .sub(new Prisma.Decimal(expenseCurrent))
            .toString(),
          previous: revenuePrevious
            .sub(new Prisma.Decimal(expensePrevious))
            .toString(),
        },
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async revenueVsExpense(query: ReportsQueryInput) {
    const range = resolveReportRange(query);
    const { storeId } = query;

    const posRows = await prisma.$queryRaw<{ bucket: Date; total: string }[]>`
      SELECT DATE_TRUNC('month', p."createdAt" ${WIB_SHIFT})::date AS bucket,
             COALESCE(SUM(p."totalAmount"), 0)::text AS total
      FROM pos_transaction p
      WHERE ${paidPosCondition}
        AND p."createdAt" BETWEEN ${range.start} AND ${range.end}
        ${posStoreFilter(storeId)}
      GROUP BY bucket
    `;

    const onlineRows = await prisma.$queryRaw<
      { bucket: Date; total: string }[]
    >`
      SELECT DATE_TRUNC('month', o."createdAt" ${WIB_SHIFT})::date AS bucket,
             COALESCE(SUM(oi.subtotal), 0)::text AS total
      FROM order_item oi
      JOIN "order" o ON oi."orderId" = o.id
      WHERE ${paidOrderCondition}
        AND o."createdAt" BETWEEN ${range.start} AND ${range.end}
        ${orderStoreFilter(storeId)}
      GROUP BY bucket
    `;

    const expenseRows = await prisma.$queryRaw<
      { bucket: Date; total: string }[]
    >`
      SELECT DATE_TRUNC('month', e.date ${WIB_SHIFT})::date AS bucket,
             COALESCE(SUM(e."totalAmount"), 0)::text AS total
      FROM expense e
      WHERE e.date BETWEEN ${range.start} AND ${range.end}
        ${storeId ? Prisma.sql`AND e."storeId" = ${BigInt(storeId)}` : Prisma.empty}
      GROUP BY bucket
    `;

    const posMap = toMonthMap(posRows);
    const onlineMap = toMonthMap(onlineRows);
    const expenseMap = toMonthMap(expenseRows);

    const data = monthKeysBetween(range.dateFrom, range.dateTo).map(
      (period) => {
        const revenuePos = posMap.get(period) ?? '0';
        const revenueOnline = onlineMap.get(period) ?? '0';

        return {
          period,
          revenue: new Prisma.Decimal(revenuePos)
            .add(new Prisma.Decimal(revenueOnline))
            .toString(),
          revenuePos,
          revenueOnline,
          expense: expenseMap.get(period) ?? '0',
        };
      },
    );

    return {
      success: true,
      data,
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async expenseByCategory(query: ReportsQueryInput) {
    const range = resolveReportRange(query);

    const rows = await prisma.$queryRaw<
      {
        categoryId: bigint;
        categoryName: string;
        color: string;
        total: string;
      }[]
    >`
      SELECT c.id AS "categoryId",
             c.name AS "categoryName",
             c.color,
             COALESCE(SUM(e."totalAmount"), 0)::text AS total
      FROM expense e
      JOIN expense_category c ON e."categoryId" = c.id
      WHERE e.date BETWEEN ${range.start} AND ${range.end}
        ${query.storeId ? Prisma.sql`AND e."storeId" = ${BigInt(query.storeId)}` : Prisma.empty}
      GROUP BY c.id, c.name, c.color
      ORDER BY SUM(e."totalAmount") DESC
    `;

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        categoryId: row.categoryId.toString(),
      })),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Menggabungkan penjualan POS dan online per varian.
   *
   * Label varian disusun dengan `string_agg` seperti pada laporan stok rendah,
   * karena SKU saja sulit dikenali orang gudang. Join ke tabel opsi sengaja
   * dilakukan di subquery terpisah supaya tidak melipatgandakan baris penjualan
   * saat dijumlahkan.
   */
  async topProducts(query: TopProductsQueryInput) {
    const range = resolveReportRange(query);
    const limit = query.limit ?? DEFAULT_TOP_PRODUCTS;
    const { storeId } = query;

    const rows = await prisma.$queryRaw<
      {
        variantId: bigint;
        productName: string;
        sku: string;
        variantLabel: string;
        quantityPos: number;
        quantityOnline: number;
        revenuePos: string;
        revenueOnline: string;
      }[]
    >`
      WITH sales AS (
        SELECT pi."productVariantId" AS variant_id,
               pi.quantity AS qty,
               pi.subtotal AS amount,
               'pos' AS channel
        FROM pos_transaction_item pi
        JOIN pos_transaction p ON pi."posTransactionId" = p.id
        WHERE ${paidPosCondition}
          AND p."createdAt" BETWEEN ${range.start} AND ${range.end}
          ${posStoreFilter(storeId)}

        UNION ALL

        SELECT oi."productVariantId" AS variant_id,
               oi.quantity AS qty,
               oi.subtotal AS amount,
               'online' AS channel
        FROM order_item oi
        JOIN "order" o ON oi."orderId" = o.id
        WHERE ${paidOrderCondition}
          AND o."createdAt" BETWEEN ${range.start} AND ${range.end}
          ${orderStoreFilter(storeId)}
      ),
      labels AS (
        SELECT po."productVariantId" AS variant_id,
               COALESCE(string_agg(vv.value, ' / ' ORDER BY vt.name), '') AS label
        FROM product_variant_option po
        JOIN product_variant_value vv ON po."variantValueId" = vv.id
        JOIN product_variant_type vt ON vv."variantTypeId" = vt.id
        GROUP BY po."productVariantId"
      )
      SELECT pv.id AS "variantId",
             pm.name AS "productName",
             pv.sku,
             COALESCE(l.label, '') AS "variantLabel",
             COALESCE(SUM(s.qty) FILTER (WHERE s.channel = 'pos'), 0)::int AS "quantityPos",
             COALESCE(SUM(s.qty) FILTER (WHERE s.channel = 'online'), 0)::int AS "quantityOnline",
             COALESCE(SUM(s.amount) FILTER (WHERE s.channel = 'pos'), 0)::text AS "revenuePos",
             COALESCE(SUM(s.amount) FILTER (WHERE s.channel = 'online'), 0)::text AS "revenueOnline"
      FROM sales s
      JOIN product_variant pv ON s.variant_id = pv.id
      JOIN product_master pm ON pv."productMasterId" = pm.id
      LEFT JOIN labels l ON l.variant_id = pv.id
      GROUP BY pv.id, pm.name, pv.sku, l.label
      ORDER BY SUM(s.qty) DESC, pm.name ASC
      LIMIT ${limit}
    `;

    return {
      success: true,
      data: rows.map((row) => ({
        variantId: row.variantId.toString(),
        productName: row.productName,
        variantLabel: row.variantLabel,
        sku: row.sku,
        quantityPos: row.quantityPos,
        quantityOnline: row.quantityOnline,
        quantityTotal: row.quantityPos + row.quantityOnline,
        revenuePos: row.revenuePos,
        revenueOnline: row.revenueOnline,
        revenueTotal: new Prisma.Decimal(row.revenuePos)
          .add(new Prisma.Decimal(row.revenueOnline))
          .toString(),
      })),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// POS dan online digabung karena pertanyaannya "uang masuk lewat apa",
  /// bukan "lewat kanal mana".
  async paymentMethods(query: ReportsQueryInput) {
    const range = resolveReportRange(query);
    const { storeId } = query;

    const rows = await prisma.$queryRaw<
      {
        paymentMethodId: bigint;
        paymentMethodName: string;
        transactionCount: number;
        total: string;
      }[]
    >`
      WITH payments AS (
        SELECT p."paymentMethodId" AS method_id, p."totalAmount" AS amount
        FROM pos_transaction p
        WHERE ${paidPosCondition}
          AND p."paymentMethodId" IS NOT NULL
          AND p."createdAt" BETWEEN ${range.start} AND ${range.end}
          ${posStoreFilter(storeId)}

        UNION ALL

        SELECT o."paymentMethodId" AS method_id, items.total AS amount
        FROM "order" o
        JOIN LATERAL (
          SELECT COALESCE(SUM(oi.subtotal), 0) AS total
          FROM order_item oi
          WHERE oi."orderId" = o.id
        ) items ON TRUE
        WHERE ${paidOrderCondition}
          AND o."createdAt" BETWEEN ${range.start} AND ${range.end}
          ${orderStoreFilter(storeId)}
      )
      SELECT m.id AS "paymentMethodId",
             m.name AS "paymentMethodName",
             COUNT(*)::int AS "transactionCount",
             COALESCE(SUM(pay.amount), 0)::text AS total
      FROM payments pay
      JOIN payment_method m ON pay.method_id = m.id
      GROUP BY m.id, m.name
      ORDER BY SUM(pay.amount) DESC
    `;

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        paymentMethodId: row.paymentMethodId.toString(),
      })),
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
