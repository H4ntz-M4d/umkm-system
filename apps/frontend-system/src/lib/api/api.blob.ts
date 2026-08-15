import managementApi from "@/lib/api/api.management";

/**
 * Mengunduh berkas dari backend.
 *
 * Sengaja lewat instance `managementApi`, bukan `fetch` mentah, supaya hook
 * penyegaran token 401 miliknya tetap berlaku — kalau tidak, mengunduh saat
 * access token baru kedaluwarsa akan gagal diam-diam.
 *
 * Tidak memakai `apiFetcher` karena fetcher itu terikat `response.json()` dan
 * validasi zod, yang akan langsung melempar begitu menerima berkas biner.
 */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await managementApi.get(path);
  const blob = await response.blob();

  /// Nama berkas diambil dari header supaya rentang tanggalnya ikut terbawa,
  /// dan hanya jatuh ke nama cadangan kalau headernya tidak ada.
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  /// Wajib dicabut, kalau tidak blob-nya menetap di memori sampai tab ditutup.
  URL.revokeObjectURL(url);
}
