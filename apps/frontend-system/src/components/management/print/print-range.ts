import { dayjs } from "@repo/utils";

/**
 * Batas atas pengambilan data untuk halaman cetak.
 *
 * Halaman cetak sengaja tidak berpaginasi — yang dicetak harus seluruh baris
 * hasil filter, bukan halaman yang kebetulan sedang tampil. Angkanya dibuat
 * besar tapi tetap berbatas supaya satu klik tidak pernah menarik tabel tak
 * terbatas; untuk kebutuhan di atas ini, ekspor Excel adalah jalurnya.
 */
export const PRINT_LIMIT = 2000;

/// Menuliskan periode di kepala dokumen cetak, supaya lembar yang sudah
/// tercetak tetap bisa dikenali rentang datanya.
export function printSubtitle(dateFrom?: string, dateTo?: string) {
  if (!dateFrom && !dateTo) return "Semua periode";

  const format = (value: string) =>
    dayjs(value).locale("id").format("DD MMMM YYYY");

  if (dateFrom && dateTo)
    return `Periode ${format(dateFrom)} – ${format(dateTo)}`;
  if (dateFrom) return `Sejak ${format(dateFrom)}`;

  return `Sampai ${format(dateTo!)}`;
}
