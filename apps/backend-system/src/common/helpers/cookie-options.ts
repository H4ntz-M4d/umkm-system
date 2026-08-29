import type { CookieOptions } from 'express';

/**
 * Masa hidup cookie refresh token.
 *
 * Access token sengaja tanpa maxAge — jadi cookie sesi yang ikut hilang saat
 * browser ditutup.
 *
 * PERHATIAN: kedua angka di bawah memang berbeda, dan itu sudah begitu sejak
 * sebelum konfigurasi ini dirapikan. Saat login cookie berumur 7 jam, tapi
 * begitu disegarkan umurnya melompat jadi 7 hari — sehingga sesi yang aktif
 * dipakai justru bertahan jauh lebih lama daripada yang dimaksudkan saat
 * login. Perilakunya sengaja TIDAK diubah di sini supaya perapian ini tidak
 * diam-diam mengubah lama sesi; angkanya diberi nama lebih dulu agar
 * selisihnya terlihat dan bisa diputuskan tersendiri.
 */
export const REFRESH_TOKEN_MAX_AGE = 7 * 60 * 60 * 1000; // 7 jam — saat login
export const REFRESH_TOKEN_RENEWAL_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 hari — saat disegarkan

/**
 * Opsi cookie sesi, ditentukan lingkungan alih-alih ditulis di tiap pemanggilan.
 *
 * Sebelumnya opsi yang sama diulang di sembilan tempat dengan `secure: false`
 * tertanam — dan satu saja yang terlewat saat go-live sudah cukup untuk
 * mengirim token sesi lewat koneksi tanpa HTTPS. Menyatukannya di sini membuat
 * kelalaian itu tidak mungkin terjadi.
 *
 * `sameSite: 'lax'` sudah memadai dan sengaja tidak dinaikkan ke `'strict'`:
 * browser hanya berbicara ke origin frontend — panggilan API dilewatkan
 * `rewrites()` Next.js — sehingga cookie tidak pernah benar-benar dikirim
 * lintas situs. `'strict'` justru akan menghapus sesi ketika pengguna kembali
 * dari halaman pembayaran Midtrans.
 */
export function authCookieOptions(maxAge?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isSecureCookieEnabled(),
    sameSite: 'lax',
    ...(maxAge === undefined ? {} : { maxAge }),
  };
}

/**
 * Menyala sendiri di produksi. `COOKIE_SECURE` hanya untuk keadaan yang tidak
 * biasa — dan skema env menolak menyalakannya ke `false` saat produksi.
 */
function isSecureCookieEnabled(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override === 'true') return true;
  if (override === 'false') return false;
  return process.env.NODE_ENV === 'production';
}
