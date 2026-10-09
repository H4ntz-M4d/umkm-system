/// Cerminan batas di backend (`upload-image.interceptors.ts`). Ditulis di sini
/// supaya gambar yang terlalu besar ketahuan sebelum dikirim, bukan setelah
/// menempuh unggahan panjang lalu ditolak.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/// Sisi terpanjang setelah dikecilkan. Cukup untuk membaca nominal dan detail
/// pada bukti transfer, jauh di bawah ukuran asli foto HP.
const MAX_DIMENSION = 1600;
const OUTPUT_TYPE = "image/jpeg";
const QUALITY = 0.8;

/**
 * Mengecilkan foto di browser sebelum diunggah.
 *
 * Kasir memotret bukti transfer dengan HP, dan berkasnya biasa 3–8 MB. Rantai
 * browser → backend → Cloudinary untuk berkas sebesar itu sering lebih lama
 * dari batas waktu permintaan, sehingga unggahan tampak gagal padahal backend
 * menyelesaikannya. Dikecilkan lebih dulu, ukurannya tinggal ratusan KB.
 *
 * Kalau browser tidak bisa membaca gambarnya (mis. HEIC di browser tertentu),
 * berkas aslinya dikembalikan apa adanya — biar backend yang menolak dengan
 * pesan yang jelas, bukan gagal diam-diam di sini.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, OUTPUT_TYPE, QUALITY),
    );

    // Hasil yang justru lebih besar tidak ada gunanya dipakai (bisa terjadi
    // pada gambar kecil atau tangkapan layar yang sudah efisien).
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: OUTPUT_TYPE });
  } catch {
    return file;
  }
}
