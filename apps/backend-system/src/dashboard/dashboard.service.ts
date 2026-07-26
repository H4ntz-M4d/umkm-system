import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { DashboardTrendPeriodType } from '@repo/schemas';
import {
  DashboardExpenseByCategoryQueryDto,
  DashboardTrendQueryDto,
} from './dto/dashboard.dto';

const PRODUCTION_STATUSES = [
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as const;

type TrendBucket = 'day' | 'week' | 'month' | 'year';

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return toDateKey(new Date(Date.UTC(year, month - 1, day + days)));
}

function addUnitToDateKey(dateKey: string, unit: TrendBucket, amount: number) {
  const [year, month, day] = dateKey.split('-').map(Number);

  if (unit === 'day') {
    return toDateKey(new Date(Date.UTC(year, month - 1, day + amount)));
  }
  if (unit === 'week') {
    return toDateKey(new Date(Date.UTC(year, month - 1, day + amount * 7)));
  }
  if (unit === 'month') {
    return toDateKey(new Date(Date.UTC(year, month - 1 + amount, 1)));
  }
  return toDateKey(new Date(Date.UTC(year + amount, month - 1, 1)));
}

// Senin sebagai awal minggu, mengikuti default DATE_TRUNC('week', ...) Postgres.
function startOfWeekKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const isoDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
  return addDaysToDateKey(dateKey, -(isoDay - 1));
}

function todayWibDateKey() {
  return toDateKey(new Date(Date.now() + 7 * 60 * 60 * 1000));
}

function resolveTrendRange(period: DashboardTrendPeriodType) {
  const todayKey = todayWibDateKey();
  const [todayYear] = todayKey.split('-').map(Number);
  const currentMonthPrefix = todayKey.slice(0, 7);

  let dateFromKey: string;
  let dateToKey: string;
  let bucket: TrendBucket;

  if (period === 'daily') {
    const daysInMonth = new Date(
      Date.UTC(todayYear, Number(currentMonthPrefix.slice(5, 7)), 0),
    ).getUTCDate();
    dateFromKey = `${currentMonthPrefix}-01`;
    dateToKey = `${currentMonthPrefix}-${String(daysInMonth).padStart(2, '0')}`;
    bucket = 'day';
  } else if (period === 'weekly') {
    dateFromKey = startOfWeekKey(addUnitToDateKey(todayKey, 'month', -3));
    dateToKey = todayKey;
    bucket = 'week';
  } else if (period === 'monthly') {
    dateFromKey = `${todayYear}-01-01`;
    dateToKey = `${todayYear}-12-31`;
    bucket = 'month';
  } else {
    dateFromKey = `${todayYear - 4}-01-01`;
    dateToKey = `${todayYear}-12-31`;
    bucket = 'year';
  }

  return {
    dateFromKey,
    dateToKey,
    bucket,
    rangeStart: new Date(`${dateFromKey}T00:00:00+07:00`),
    rangeEnd: new Date(`${dateToKey}T23:59:59+07:00`),
  };
}

@Injectable()
export class DashboardService {
  async orderTrend(query: DashboardTrendQueryDto) {
    const { dateFromKey, dateToKey, bucket, rangeStart, rangeEnd } =
      resolveTrendRange(query.period);

    const onlineRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COUNT(*)::bigint AS count
      FROM "order"
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
      GROUP BY day
      ORDER BY day
    `;

    const posRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COUNT(*)::bigint AS count
      FROM pos_transaction
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
      GROUP BY day
      ORDER BY day
    `;

    const onlineMap = new Map(
      onlineRows.map((row) => [toDateKey(row.day), Number(row.count)]),
    );
    const posMap = new Map(
      posRows.map((row) => [toDateKey(row.day), Number(row.count)]),
    );

    const data: { date: string; online: number; pos: number }[] = [];
    let cursor = dateFromKey;
    while (cursor <= dateToKey) {
      data.push({
        date: cursor,
        online: onlineMap.get(cursor) ?? 0,
        pos: posMap.get(cursor) ?? 0,
      });
      cursor = addUnitToDateKey(cursor, bucket, 1);
    }

    return {
      success: true,
      data,
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async omzetTrend(query: DashboardTrendQueryDto) {
    const { dateFromKey, dateToKey, bucket, rangeStart, rangeEnd } =
      resolveTrendRange(query.period);

    const onlineRows = await prisma.$queryRaw<{ day: Date; total: string }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COALESCE(SUM("totalAmount"), 0) AS total
      FROM "order"
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
      GROUP BY day
      ORDER BY day
    `;

    const posRows = await prisma.$queryRaw<{ day: Date; total: string }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COALESCE(SUM("totalAmount"), 0) AS total
      FROM pos_transaction
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
      GROUP BY day
      ORDER BY day
    `;

    const onlineMap = new Map(
      onlineRows.map((row) => [toDateKey(row.day), Number(row.total)]),
    );
    const posMap = new Map(
      posRows.map((row) => [toDateKey(row.day), Number(row.total)]),
    );

    const data: { date: string; online: string; pos: string }[] = [];
    let cursor = dateFromKey;
    while (cursor <= dateToKey) {
      data.push({
        date: cursor,
        online: (onlineMap.get(cursor) ?? 0).toString(),
        pos: (posMap.get(cursor) ?? 0).toString(),
      });
      cursor = addUnitToDateKey(cursor, bucket, 1);
    }

    return {
      success: true,
      data,
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async expenseByCategory(query: DashboardExpenseByCategoryQueryDto) {
    const now = new Date();
    const dateFrom =
      query.period === 'yearly'
        ? new Date(now.getFullYear(), 0, 1)
        : new Date(now.getFullYear(), now.getMonth(), 1);
    const dateTo =
      query.period === 'yearly'
        ? new Date(now.getFullYear() + 1, 0, 1)
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      _sum: { totalAmount: true },
      where: {
        date: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
    });

    const categories = await prisma.expenseCategory.findMany({
      select: { id: true, name: true, color: true },
    });
    const categoryMap = new Map(
      categories.map((category) => [category.id.toString(), category]),
    );

    const data = grouped.map((group) => {
      const category = categoryMap.get(group.categoryId.toString());
      return {
        categoryId: group.categoryId.toString(),
        categoryName: category?.name ?? 'Lainnya',
        color: category?.color ?? '#a1a1aa',
        total: (group._sum.totalAmount ?? 0).toString(),
      };
    });

    return {
      success: true,
      data,
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async productionStatus() {
    const grouped = await prisma.production.groupBy({
      by: ['status'],
      _count: true,
    });

    const countMap = new Map(
      grouped.map((group) => [group.status, group._count]),
    );

    const data = PRODUCTION_STATUSES.map((status) => ({
      status,
      count: countMap.get(status) ?? 0,
    }));

    return {
      success: true,
      data,
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
