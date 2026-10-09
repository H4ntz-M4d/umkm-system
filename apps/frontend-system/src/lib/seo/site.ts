/**
 * Identitas situs untuk mesin pencari.
 *
 * Ditulis sekali di sini karena dipakai di banyak tempat yang harus selalu
 * sepakat: judul halaman, canonical, sitemap, robots, dan gambar pratinjau
 * saat tautan dibagikan. Kalau tersebar, satu saja yang ketinggalan berarti
 * Google menerima dua keterangan berbeda tentang situs yang sama.
 */

export const SITE_NAME = "Nurfa Craft";

/// Kalimat inti tentang toko, berdiri sendiri tanpa nama di depannya.
/// Dipisah supaya gambar pratinjau — yang sudah menampilkan nama toko dengan
/// huruf besar — tidak perlu memotong-motong kalimat deskripsi.
export const SITE_TAGLINE =
  "Tas dan produk rajut tangan buatan pengrajin Yogyakarta. Bisa dipesan sesuai warna, ukuran, dan model.";

export const SITE_DESCRIPTION = `${SITE_NAME} — ${SITE_TAGLINE.charAt(0).toLowerCase()}${SITE_TAGLINE.slice(1)}`;

/// Dipakai saat env belum diisi, supaya pengembangan tetap jalan.
const FALLBACK_URL = "http://localhost:3000";

/**
 * Alamat penuh situs, tanpa garis miring di akhir.
 *
 * WAJIB diisi lewat `NEXT_PUBLIC_SITE_URL` sebelum situs dionlinekan. Kalau
 * masih kosong saat produksi, canonical akan menunjuk ke localhost — dan itu
 * memberi tahu Google bahwa halaman aslinya ada di komputer yang tidak bisa
 * dijangkau siapa pun. Karena itu keadaan tersebut diperlakukan sebagai
 * kesalahan, bukan sekadar nilai bawaan (lihat `isSiteUrlConfigured`).
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_URL
).replace(/\/+$/, "");

/// Benar hanya bila alamat aslinya sudah diisi. Dipakai robots.ts untuk
/// menutup situs dari mesin pencari selama alamatnya belum benar.
export const isSiteUrlConfigured = Boolean(process.env.NEXT_PUBLIC_SITE_URL);

/// Merakit alamat penuh dari path. Dipakai canonical dan sitemap supaya
/// keduanya tidak pernah menghasilkan bentuk yang berbeda.
export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Membuat canonical untuk satu halaman.
 *
 * Halaman yang sama bisa dibuka lewat banyak alamat — dengan penyaring,
 * urutan, atau nomor halaman. Canonical menunjuk satu alamat resmi supaya
 * Google tidak menganggapnya sebagai beberapa halaman mirip (konten duplikat)
 * lalu memilih sendiri mana yang ditampilkan.
 */
export function canonical(path: string) {
  return { canonical: absoluteUrl(path) };
}
