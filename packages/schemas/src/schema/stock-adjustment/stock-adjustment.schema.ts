import z from "zod";

export const StockAdjustmentItemSchema = z.object({
  productVariantId: z.string(),
  /// Jumlah sebenarnya hasil hitung fisik — bukan selisih. Admin menghitung
  /// barang, bukan menghitung selisih, jadi itu pula yang diminta form.
  countedStock: z.number().int().min(0, "Jumlah tidak boleh negatif"),
});

export const StockAdjustmentSchema = z.object({
  /// Hanya dikirim oleh akun yang tidak terikat toko; untuk yang terikat,
  /// tokonya diambil dari token dan kiriman ini diabaikan.
  storeId: z.string().optional(),
  reason: z
    .string()
    .trim()
    .min(5, "Alasan minimal 5 karakter — tulis apa yang terjadi"),
  items: z
    .array(StockAdjustmentItemSchema)
    .min(1, "Pilih minimal satu varian untuk disesuaikan"),
});

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentSchema>;

export const StockAdjustmentQuerySchema = z.object({
  storeId: z.string().optional(),
  search: z.string().optional(),
});

export type StockAdjustmentQueryInput = z.infer<
  typeof StockAdjustmentQuerySchema
>;
