import z from "zod";

/**
 * Status yang dianggap "uang sudah masuk" untuk pesanan online.
 *
 * Bukan hanya `PAID`: pesanan yang sudah lunas berpindah status begitu diproses
 * gudang, jadi memfilter `PAID` saja akan menghilangkan sebagian besar
 * pemasukan. Pada data saat ini `SHIPPED` + `COMPLETED` mewakili sekitar 56%
 * pemasukan online. `REFUNDED` dikecualikan karena uangnya kembali ke pelanggan.
 */
export const PAID_ORDER_STATUSES = ["PAID", "SHIPPED", "COMPLETED"] as const;

/// Untuk POS jauh lebih sederhana: PENDING dan PARKED belum dibayar.
export const PAID_POS_STATUSES = ["PAID"] as const;

export const ReportsQuerySchema = z.object({
  /// Format "yyyy-MM-dd". Ditafsirkan pada zona WIB oleh backend.
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  storeId: z.string().optional(),
});

export type ReportsQueryInput = z.infer<typeof ReportsQuerySchema>;

export const TopProductsQuerySchema = ReportsQuerySchema.extend({
  /// Maksimal 10 agar grafik tetap terbaca; sisanya digabung "Lainnya".
  limit: z.coerce.number().min(1).max(50).optional(),
});

export type TopProductsQueryInput = z.infer<typeof TopProductsQuerySchema>;
