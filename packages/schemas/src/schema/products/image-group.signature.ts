/**
 * Identitas sebuah Image Group: kombinasi nilai variant dari tipe yang visual.
 *
 * Dipakai bersama backend dan frontend, jadi hasilnya HARUS identik byte per byte
 * di kedua sisi. Berbasis NAMA, bukan id, karena update() menghapus lalu membuat
 * ulang semua tipe dan nilai variant setiap kali simpan sehingga id selalu berganti.
 */

export type SignaturePair = [typeName: string, valueName: string];

/**
 * Bentuk kanonik: pasangan di-trim lalu diurutkan berdasarkan nama tipe.
 * Memakai JSON, bukan gabungan berpemisah, supaya nama yang mengandung
 * "|" atau ":" tidak bisa bertabrakan.
 */
export function canonicalSignature(pairs: SignaturePair[]): string {
  const normalized = pairs
    .map(([type, value]) => [type.trim(), value.trim()] as SignaturePair)
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  return JSON.stringify(normalized);
}

/** Grup level produk: tanpa tipe visual, atau useVariant = false. */
export const EMPTY_IMAGE_GROUP_SIGNATURE = canonicalSignature([]);

/** Signature grup tempat sebuah variant bernaung. */
export function signatureForOptions(
  options: Record<string, string>,
  visualTypeNames: ReadonlySet<string>,
): string {
  if (visualTypeNames.size === 0) return EMPTY_IMAGE_GROUP_SIGNATURE;

  return canonicalSignature(
    Object.entries(options ?? {}).filter(([type]) =>
      visualTypeNames.has(type.trim()),
    ) as SignaturePair[],
  );
}

/** Pasangan penyusun signature, untuk membangun ulang junction atau label. */
export function parseSignature(signature: string): SignaturePair[] {
  return JSON.parse(signature) as SignaturePair[];
}

/** Label yang ditampilkan ke admin, misal "merah / katun". */
export function signatureLabel(signature: string): string {
  const pairs = parseSignature(signature);
  return pairs.length === 0
    ? "Foto Produk"
    : pairs.map(([, value]) => value).join(" / ");
}
