import z from "zod";

export const InventoryItemType = z.enum(["RAW_MATERIAL", "PRODUCT_VARIANT"]);
export const LedgerDirection = z.enum(["IN", "OUT"]);
export const LedgerSource = z.enum([
  "PRODUCTION",
  "ONLINE_ORDER",
  "POS",
  "PURCHASE",
  "ADJUSTMENT",
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