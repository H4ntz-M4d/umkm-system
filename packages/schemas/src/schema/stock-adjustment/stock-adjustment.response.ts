import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

/// Satu baris varian beserta stoknya di toko yang sedang dibuka.
export const StockAdjustmentRowData = z.object({
  productVariantId: z.coerce.string(),
  productName: z.string(),
  variantLabel: z.string(),
  sku: z.string(),
  stock: z.number(),
  /// Bagian stok yang sudah dikunci pesanan. Penyesuaian tidak boleh membuat
  /// stok turun di bawah angka ini, jadi layar perlu menampilkannya.
  reservedStock: z.number(),
});

export const StockAdjustmentRowsResponse = ApiSuccessResponse(
  z.object({
    storeId: z.coerce.string(),
    storeName: z.string(),
    rows: z.array(StockAdjustmentRowData),
  }),
);

export const StockAdjustmentResultResponse = ApiSuccessResponse(
  z.object({
    id: z.coerce.string(),
    code: z.string(),
    storeName: z.string(),
    /// Jumlah varian yang benar-benar berubah — yang diisi sama dengan stok
    /// sekarang sengaja dilewati, bukan dicatat sebagai perubahan nol.
    changedCount: z.number(),
  }),
);

export type StockAdjustmentRowDataType = z.infer<typeof StockAdjustmentRowData>;
