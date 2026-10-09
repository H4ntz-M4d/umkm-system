/**
 * Ukuran stiker label barcode.
 *
 * Satu-satunya tempat ukuran ini ditulis — halaman cetak, pratinjau, dan
 * hitungan peringatan semuanya membaca dari sini. Kalau nanti ukuran stiker
 * diganti, cukup ubah angka di bawah, lalu samakan juga ukuran kertas di
 * pengaturan driver printer thermal-nya.
 */
export const LABEL_WIDTH_MM = 40;
export const LABEL_HEIGHT_MM = 30;
export const LABEL_PADDING_MM = 1.5;

/// Batas satu kali cetak, supaya salah ketik (mis. 5000) tidak menghabiskan
/// satu gulungan stiker.
export const MAX_LABELS_PER_PRINT = 500;

/**
 * Asumsi resolusi printer thermal. 203 dpi adalah yang paling umum untuk
 * printer label barcode kelas UMKM; nilai ini hanya dipakai untuk memberi
 * peringatan, tidak mengubah hasil cetak.
 */
export const PRINTER_DPI = 203;

/// Batang tersempit yang masih andal terbaca: dua titik printer (±0,25 mm di
/// 203 dpi). Batang yang lebih sempit bisa melebur atau putus saat dicetak.
export const MIN_READABLE_MODULE_MM = (2 * 25.4) / PRINTER_DPI;
