import { Injectable } from '@nestjs/common';
import type { JwtPayload } from 'common/decorator/auth.decorator';
import { findProductionHouse } from 'common/helpers/online-store';
import { Prisma, prisma } from '@repo/db';
import { DashboardTrendPeriodType } from '@repo/schemas';
import {
  DashboardExpenseByCategoryQueryDto,
  DashboardScopeQueryDto,
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

/// Nilai khusus yang berarti "gabungkan semua toko".
const ALL_STORES = 'all';

/**
 * Potongan WHERE untuk menyaring per toko di kueri mentah.
 *
 * Dibuat lewat `Prisma.sql` dengan nilai sebagai parameter, bukan dirangkai
 * jadi teks — id-nya berasal dari permintaan pengguna, dan merangkainya
 * langsung membuka celah penyuntikan SQL.
 */
function storeScopeSql(storeId: bigint | null, alias?: string): Prisma.Sql {
  if (storeId === null) return Prisma.empty;

  return alias
    ? Prisma.sql`AND ${Prisma.raw(`"${alias}"`)}."storeId" = ${storeId}`
    : Prisma.sql`AND "storeId" = ${storeId}`;
}

@Injectable()
export class DashboardService {
  /**
   * Menentukan toko mana yang boleh dilihat pemanggil.
   *
   * Cabang Nurfa Craft berdiri sendiri: pendapatan mereka bukan pendapatan
   * pusat, dan sebaliknya. Karena itu akun yang terikat toko SELALU dikunci ke
   * tokonya sendiri — `storeId` yang dikirim layar diabaikan untuk mereka,
   * supaya angka toko lain tidak bisa dilihat hanya dengan mengganti
   * parameter di URL.
   *
   * Akun pusat (tanpa toko) yang memilih. Tanpa pilihan, yang ditampilkan
   * adalah toko pusat — bukan gabungan — karena angka gabungan menjumlahkan
   * uang usaha lain ke dalam omzet sendiri, dan itu menyesatkan kalau muncul
   * begitu saja tanpa diminta.
   *
   * Mengembalikan `null` berarti tanpa penyaringan (gabungan).
   */
  private async resolveScope(
    user: JwtPayload,
    requestedStoreId?: string,
  ): Promise<bigint | null> {
    if (user.storeId) return BigInt(user.storeId);

    if (requestedStoreId === ALL_STORES) return null;
    if (requestedStoreId) return BigInt(requestedStoreId);

    const central = await findProductionHouse();
    return central.id;
  }

  async orderTrend(query: DashboardTrendQueryDto, user: JwtPayload) {
    const { dateFromKey, dateToKey, bucket, rangeStart, rangeEnd } =
      resolveTrendRange(query.period);
    const storeId = await this.resolveScope(user, query.storeId);
    const storeFilter = storeScopeSql(storeId);

    const onlineRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COUNT(*)::bigint AS count
      FROM "order"
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
        ${storeFilter}
      GROUP BY day
      ORDER BY day
    `;

    const posRows = await prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COUNT(*)::bigint AS count
      FROM pos_transaction
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
        ${storeFilter}
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

  async omzetTrend(query: DashboardTrendQueryDto, user: JwtPayload) {
    const { dateFromKey, dateToKey, bucket, rangeStart, rangeEnd } =
      resolveTrendRange(query.period);
    const storeId = await this.resolveScope(user, query.storeId);
    const storeFilter = storeScopeSql(storeId);

    /**
     * Omzet online dihitung dari KAS pesanan, sama seperti halaman laporan
     * (lihat catatan panjang di reports.revenue.ts).
     *
     * Dulu di sini dijumlahkan `totalAmount` semua pesanan yang bukan batal.
     * Sejak harga dinego lewat WhatsApp, pesanan yang baru diajukan pun sudah
     * punya `totalAmount` (berisi perkiraan dari harga katalog), sehingga
     * grafik omzet ikut menghitung uang yang belum tentu pernah masuk — dan
     * refund tidak pernah menguranginya.
     */
    const onlineRows = await prisma.$queryRaw<{ day: Date; total: string }[]>`
      SELECT DATE_TRUNC(${bucket}, c."createdAt" + INTERVAL '7 hours')::date AS day,
             COALESCE(SUM(CASE WHEN c.type = 'IN' THEN c.amount ELSE -c.amount END), 0) AS total
      FROM cash_transaction c
      WHERE c.source = 'ORDER'
        AND c."createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
        ${storeScopeSql(storeId, 'c')}
      GROUP BY day
      ORDER BY day
    `;

    const posRows = await prisma.$queryRaw<{ day: Date; total: string }[]>`
      SELECT DATE_TRUNC(${bucket}, "createdAt" + INTERVAL '7 hours')::date AS day,
             COALESCE(SUM("totalAmount"), 0) AS total
      FROM pos_transaction
      WHERE status != 'CANCELLED'
        AND "createdAt" BETWEEN ${rangeStart} AND ${rangeEnd}
        ${storeFilter}
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

  async expenseByCategory(
    query: DashboardExpenseByCategoryQueryDto,
    user: JwtPayload,
  ) {
    const storeId = await this.resolveScope(user, query.storeId);
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
        ...(storeId !== null && { storeId }),
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

  async productionStatus(query: DashboardScopeQueryDto, user: JwtPayload) {
    const storeId = await this.resolveScope(user, query.storeId);

    /**
     * Produksi tidak punya kolom toko: seluruhnya terjadi di rumah produksi.
     *
     * Jadi saat yang dilihat adalah satu toko selain rumah produksi, jawabannya
     * memang nol — toko itu tidak memproduksi apa pun. Dikembalikan nol,
     * bukan angka pusat, supaya cabang tidak melihat kegiatan yang bukan
     * miliknya.
     */
    if (storeId !== null) {
      const central = await findProductionHouse();
      if (central.id !== storeId) {
        return {
          success: true,
          data: PRODUCTION_STATUSES.map((status) => ({ status, count: 0 })),
          meta: { timeStamp: new Date().toISOString() },
        };
      }
    }

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
