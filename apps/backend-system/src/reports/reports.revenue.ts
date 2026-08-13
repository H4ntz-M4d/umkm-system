import { Prisma, prisma } from '@repo/db';
import {
  PAID_ORDER_STATUSES,
  PAID_POS_STATUSES,
  type ReportsQueryInput,
} from '@repo/schemas';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';

/**
 * Satu-satunya tempat yang menentukan "uang sudah masuk" untuk seluruh laporan.
 *
 * Dikumpulkan di sini, bukan disebar ke tiap query, karena definisi pemasukan
 * mudah menyimpang antar laporan dan penyimpangan itu tidak terlihat — angkanya
 * tetap tampil wajar, hanya salah. Dua aturan yang dijaga:
 *
 * 1. **Pesanan online: `PAID`, `SHIPPED`, dan `COMPLETED`.** Pesanan lunas
 *    berpindah status saat diproses gudang, jadi memfilter `PAID` saja
 *    menghilangkan sebagian besar pemasukan — pada data sekarang sekitar 56%.
 * 2. **Ongkir tidak dihitung.** `Order.totalAmount` sudah mengandung ongkir
 *    (`customer-order.service.ts`), jadi nilai online diambil dari
 *    `SUM(order_item.subtotal)`. Saat ini ongkir masih nol sehingga kedua cara
 *    menghasilkan angka sama, tapi memakai subtotal membuat laporan tetap benar
 *    begitu ongkir mulai dikenakan, tanpa perlu menyentuh kode ini.
 *
 * Perbedaan dengan dashboard disengaja: `dashboard.service.ts` memakai
 * `status != 'CANCELLED'` dan `totalAmount`, sehingga ikut menghitung pesanan
 * yang belum dibayar. Dashboard tidak diubah, jadi angka laporan memang lebih
 * kecil — halaman laporan yang menjelaskan definisinya sendiri.
 */

const DATE_KEY_LENGTH = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateWindow {
  dateFrom: string;
  dateTo: string;
  start: Date;
  end: Date;
}

export interface ResolvedReportRange extends DateWindow {
  /// Rentang pembanding: panjang hari yang sama, digeser ke belakang.
  previous: DateWindow;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, DATE_KEY_LENGTH);
}

/// Sengaja dihitung di ruang UTC supaya penggeseran hari tidak terpengaruh
/// offset zona waktu; konversi ke WIB baru terjadi di toStartOfDay/toEndOfDay.
function parseDateKey(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, (month ?? 1) - 1, day ?? 1);
}

function buildWindow(dateFrom: string, dateTo: string): DateWindow {
  return {
    dateFrom,
    dateTo,
    start: toStartOfDay(dateFrom),
    end: toEndOfDay(dateTo),
  };
}

/**
 * Tanpa filter, laporan default ke bulan berjalan — pilihan yang sama dengan
 * preset pertama di UI, sehingga membuka halaman tanpa parameter menampilkan
 * hal yang sama dengan memilih "Bulan ini".
 */
export function resolveReportRange(
  query: ReportsQueryInput,
): ResolvedReportRange {
  const now = new Date();
  const dateFrom =
    query.dateFrom ||
    toDateKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
  const dateTo = query.dateTo || toDateKey(now);

  const fromMs = parseDateKey(dateFrom);
  const toMs = parseDateKey(dateTo);
  const spanDays = Math.max(1, Math.round((toMs - fromMs) / MS_PER_DAY) + 1);

  const previousToMs = fromMs - MS_PER_DAY;
  const previousFromMs = previousToMs - (spanDays - 1) * MS_PER_DAY;

  return {
    ...buildWindow(dateFrom, dateTo),
    previous: buildWindow(
      toDateKey(new Date(previousFromMs)),
      toDateKey(new Date(previousToMs)),
    ),
  };
}

/// Dipakai berulang di banyak query, jadi dijadikan fragmen agar nama kolomnya
/// tidak diketik ulang dan tidak sempat menyimpang.
export function posStoreFilter(storeId?: string): Prisma.Sql {
  return storeId
    ? Prisma.sql`AND p."storeId" = ${BigInt(storeId)}`
    : Prisma.empty;
}

export function orderStoreFilter(storeId?: string): Prisma.Sql {
  return storeId
    ? Prisma.sql`AND o."storeId" = ${BigInt(storeId)}`
    : Prisma.empty;
}

const paidOrderStatuses = Prisma.join(
  PAID_ORDER_STATUSES.map((status) => Prisma.sql`${status}`),
);
const paidPosStatuses = Prisma.join(
  PAID_POS_STATUSES.map((status) => Prisma.sql`${status}`),
);

export const paidPosCondition = Prisma.sql`p.status::text IN (${paidPosStatuses})`;
export const paidOrderCondition = Prisma.sql`o.status::text IN (${paidOrderStatuses})`;

/// Semua nilai uang dikembalikan sebagai string (`::text` di SQL) supaya tidak
/// pernah melewati float sebelum sampai ke frontend.
async function sumOf(query: Prisma.Sql): Promise<string> {
  const rows = await prisma.$queryRaw<{ total: string }[]>(query);
  return rows[0]?.total ?? '0';
}

export function posRevenue(window: DateWindow, storeId?: string) {
  return sumOf(Prisma.sql`
    SELECT COALESCE(SUM(p."totalAmount"), 0)::text AS total
    FROM pos_transaction p
    WHERE ${paidPosCondition}
      AND p."createdAt" BETWEEN ${window.start} AND ${window.end}
      ${posStoreFilter(storeId)}
  `);
}

export function onlineRevenue(window: DateWindow, storeId?: string) {
  return sumOf(Prisma.sql`
    SELECT COALESCE(SUM(oi.subtotal), 0)::text AS total
    FROM order_item oi
    JOIN "order" o ON oi."orderId" = o.id
    WHERE ${paidOrderCondition}
      AND o."createdAt" BETWEEN ${window.start} AND ${window.end}
      ${orderStoreFilter(storeId)}
  `);
}

/// Pengeluaran memakai kolom `date` miliknya sendiri, bukan `createdAt`:
/// tanggal transaksi bisa berbeda dari kapan catatannya dibuat.
export function expenseTotal(window: DateWindow, storeId?: string) {
  return sumOf(Prisma.sql`
    SELECT COALESCE(SUM(e."totalAmount"), 0)::text AS total
    FROM expense e
    WHERE e.date BETWEEN ${window.start} AND ${window.end}
      ${storeId ? Prisma.sql`AND e."storeId" = ${BigInt(storeId)}` : Prisma.empty}
  `);
}
