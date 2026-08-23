import z from "zod";

export const TransferStatus = z.enum([
  "READY",
  "SENT",
  "RECEIVED",
  "CANCELLED",
]);

export type TransferStatusType = z.infer<typeof TransferStatus>;

export const StockTransferItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number().int().positive("Jumlah harus lebih dari nol"),
});

/**
 * Asal pengiriman tidak diminta dari client.
 *
 * Distribusi selalu berangkat dari rumah produksi — itu bentuk usahanya, bukan
 * pilihan per kiriman. Menerimanya dari body hanya akan membuka celah mencatat
 * barang keluar dari toko yang tidak pernah memegangnya.
 */
export const CreateStockTransferSchema = z.object({
  toStoreId: z.string(),
  notes: z.string().optional().nullable(),
  items: z
    .array(StockTransferItemSchema)
    .min(1, "Kiriman harus berisi minimal satu produk"),
});

export type CreateStockTransferInput = z.infer<
  typeof CreateStockTransferSchema
>;

export const StockTransferQuerySchema = z.object({
  skip: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  search: z.string().optional(),
  status: TransferStatus.optional(),
  toStoreId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type StockTransferQueryInput = z.infer<typeof StockTransferQuerySchema>;
