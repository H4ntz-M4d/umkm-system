import z from "zod";

/// `RAW_MATERIAL` sudah tidak ada di Prisma sejak modul bahan baku dibongkar.
/// Memfilternya membuat kueri SQL gagal karena kolomnya bertipe enum.
export const InventoryItemType = z.enum(["PRODUCT_VARIANT"]);
export const LedgerDirection = z.enum(["IN", "OUT"]);
/**
 * Harus persis sama dengan `enum LedgerSource` di schema.prisma.
 *
 * Responsnya berupa array, jadi satu baris dengan nilai yang tidak dikenal
 * membuat SELURUH respons ditolak `apiFetcher` — tabelnya kosong tanpa galat
 * apa pun di Network. `TRANSFER` pernah terlewat di sini dan itulah gejalanya.
 *
 * `PURCHASE` sengaja tidak ada: nilainya tidak pernah ada di Prisma, dan
 * memfilternya membuat kueri SQL gagal karena kolomnya bertipe enum.
 */
export const LedgerSource = z.enum([
  "PRODUCTION",
  "ONLINE_ORDER",
  "POS",
  "ADJUSTMENT",
  "TRANSFER",
]);

export const InventoryLedgerSchema = z.object({
    storeId: z.number(),
    itemType: InventoryItemType,
    itemId: z.number(),
    direction: LedgerDirection,
    source: LedgerSource,
    quantity: z.number(),
    referenceId: z.number().optional(),
});