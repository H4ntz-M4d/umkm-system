/**
 * Utilitas bersama untuk seed.
 *
 * Acaknya sengaja deterministik (mulberry32 dengan benih tetap) supaya menjalankan
 * ulang seed menghasilkan data yang persis sama. Kalau memakai Math.random, setiap
 * reset menghasilkan angka berbeda dan laporan jadi tidak bisa dibandingkan.
 */

let state = 20260728;

export function resetRandom(seed = 20260728) {
  state = seed;
}

export function random(): number {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** Bilangan bulat acak dalam rentang inklusif. */
export function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(random() * items.length)]!;
}

/** Memilih beberapa item unik. */
export function pickMany<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];
  const chosen: T[] = [];

  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = Math.floor(random() * pool.length);
    chosen.push(pool.splice(index, 1)[0]!);
  }

  return chosen;
}

/** Terjadi dengan peluang `probability` (0..1). */
export function chance(probability: number): boolean {
  return random() < probability;
}

// ============================== Tanggal =====================================

export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Menempelkan jam operasional toko ke sebuah tanggal (09.00–20.00), supaya
 * transaksi tidak semuanya tercatat tengah malam.
 */
export function atBusinessHour(date: Date): Date {
  const result = new Date(date);
  result.setHours(randomInt(9, 20), randomInt(0, 59), randomInt(0, 59), 0);
  return result;
}

export function atHour(date: Date, hour: number, minute = 0): Date {
  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

/** Sabtu atau Minggu — dipakai untuk menaikkan ramai transaksi akhir pekan. */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// ============================== Format ======================================

/**
 * Nomor transaksi mengikuti common/helpers/id-format.ts di backend:
 * `PREFIX-YYYYMD-XXXX`. Bagian acaknya diambil dari PRNG seed supaya tetap
 * deterministik, dan keunikannya dijaga pemanggil lewat set.
 */
export function formatTransactionId(prefix: string, date: Date): string {
  const stamp = `${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}`;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  let suffix = "";
  for (let i = 0; i < 4; i += 1) suffix += chars[randomInt(0, chars.length - 1)];

  return `${prefix}-${stamp}-${suffix}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Membulatkan ke ratusan rupiah terdekat supaya harga terlihat wajar. */
export function roundPrice(value: number): number {
  return Math.round(value / 500) * 500;
}
