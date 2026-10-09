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
 1. **Pesanan online dihitung dari KAS pesanan, bukan dari statusnya.**
 *    Pemasukan online = seluruh kas bersumber `ORDER` yang masuk, dikurangi
 *    yang keluar, pada rentang tanggal yang diminta.
 *
 *    Sebelumnya laporan menjumlahkan `order_item.subtotal` untuk pesanan
 *    berstatus `PAID`/`SHIPPED`/`COMPLETED`. Sejak pesanan dinego lewat
 *    WhatsApp, cara itu salah di dua sisi sekaligus: **DP yang sudah diterima
 *    tidak terhitung** selama pesanannya belum lunas, dan **pembatalan atau
 *    refund tidak pernah mengurangi** omzet walaupun uangnya sudah keluar.
 *    Kas mencatat keduanya apa adanya, jadi dipakai langsung.
 *
 *    Ikutan penting: uang dihitung pada bulan uangnya MASUK, bukan bulan
 *    pesanannya dibuat. Untuk pesanan yang DP-nya bulan lalu dan lunasnya
 *    bulan ini, itu justru yang benar.
 *
 * 2. **Ongkir tidak lagi jadi soal di sisi uang**, karena yang dijumlahkan
 *    adalah kas. Untuk laporan yang memang per produk (produk terlaris), yang
 *    dipakai tetap `order_item.subtotal` dengan status
 *    `PAID`/`SHIPPED`/`COMPLETED` — di situ pertanyaannya "barang apa yang
 *    laku", bukan "uangnya berapa".
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
/// Dipakai laporan yang menghitung BARANG (produk terlaris), bukan uang.
export const paidOrderCondition = Prisma.sql`o.status::text IN (${paidOrderStatuses})`;

/// Kas pesanan online: masuk dikurangi keluar. Refund dan pembatalan yang
/// mengembalikan uang otomatis ikut mengurangi karena tercatat sebagai OUT.
export const ORDER_CASH_AMOUNT = Prisma.sql`SUM(CASE WHEN c.type = 'IN' THEN c.amount ELSE -c.amount END)`;

export function cashStoreFilter(storeId?: string): Prisma.Sql {
  return storeId
    ? Prisma.sql`AND c."storeId" = ${BigInt(storeId)}`
    : Prisma.empty;
}

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

/**
 * Pemasukan pesanan custom.
 *
 * Dihitung dari kas bersumber BESPOKE, dengan alasan yang sama seperti
 * pesanan online: yang dijumlahkan adalah uang yang benar-benar masuk, pada
 * bulan uangnya masuk. Sebelum sumber ini ada, uang pesanan custom menyamar
 * sebagai mutasi produksi dan tidak pernah terhitung sebagai omzet sama
 * sekali.
 */
export function bespokeRevenue(window: DateWindow, storeId?: string) {
  return sumOf(Prisma.sql`
    SELECT COALESCE(${ORDER_CASH_AMOUNT}, 0)::text AS total
    FROM cash_transaction c
    WHERE c.source = 'BESPOKE'
      AND c."createdAt" BETWEEN ${window.start} AND ${window.end}
      ${cashStoreFilter(storeId)}
  `);
}

export function onlineRevenue(window: DateWindow, storeId?: string) {
  return sumOf(Prisma.sql`
    SELECT COALESCE(${ORDER_CASH_AMOUNT}, 0)::text AS total
    FROM cash_transaction c
    WHERE c.source = 'ORDER'
      AND c."createdAt" BETWEEN ${window.start} AND ${window.end}
      ${cashStoreFilter(storeId)}
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
