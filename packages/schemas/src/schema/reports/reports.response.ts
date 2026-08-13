import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

/**
 * Semua nilai uang dikirim sebagai string, mengikuti konvensi
 * `dashboard.response.ts`: Prisma Decimal diubah ke string di backend supaya
 * tidak ada pembulatan float di jalur uang. Frontend yang meng-`Number()`-kan
 * saat menggambar grafik.
 */

/// Rentang yang benar-benar dipakai backend, dikirim balik supaya judul kartu
/// dan hasil cetak bisa menuliskan periode yang sama persis dengan datanya.
export const ReportRange = z.object({
  dateFrom: z.string(),
  dateTo: z.string(),
});

const MoneyWithPrevious = z.object({
  current: z.string(),
  previous: z.string(),
});

export const ReportSummaryData = z.object({
  range: ReportRange,
  /// Rentang pembanding: panjangnya sama, digeser ke belakang.
  previousRange: ReportRange,
  revenue: MoneyWithPrevious,
  revenuePos: MoneyWithPrevious,
  revenueOnline: MoneyWithPrevious,
  expense: MoneyWithPrevious,
  /// revenue - expense.
  balance: MoneyWithPrevious,
});

export const RevenueExpensePoint = z.object({
  /// Kunci bucket bulanan, format "yyyy-MM".
  period: z.string(),
  revenue: z.string(),
  revenuePos: z.string(),
  revenueOnline: z.string(),
  expense: z.string(),
});

export const ExpenseCategoryPoint = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  /// Warna milik kategori itu sendiri, dari kolom `ExpenseCategory.color`.
  color: z.string(),
  total: z.string(),
});

export const TopProductPoint = z.object({
  variantId: z.string(),
  productName: z.string(),
  variantLabel: z.string(),
  sku: z.string(),
  quantityPos: z.number(),
  quantityOnline: z.number(),
  quantityTotal: z.number(),
  revenuePos: z.string(),
  revenueOnline: z.string(),
  revenueTotal: z.string(),
});

export const PaymentMethodPoint = z.object({
  paymentMethodId: z.string(),
  paymentMethodName: z.string(),
  transactionCount: z.number(),
  total: z.string(),
});

export const ReportSummaryResponse = ApiSuccessResponse(ReportSummaryData);
export const RevenueExpenseResponse = ApiSuccessResponse(
  z.array(RevenueExpensePoint),
);
export const ExpenseByCategoryReportResponse = ApiSuccessResponse(
  z.array(ExpenseCategoryPoint),
);
export const TopProductsResponse = ApiSuccessResponse(z.array(TopProductPoint));
export const PaymentMethodsResponse = ApiSuccessResponse(
  z.array(PaymentMethodPoint),
);

export type ReportSummaryDataType = z.infer<typeof ReportSummaryData>;
export type RevenueExpensePointType = z.infer<typeof RevenueExpensePoint>;
export type ExpenseCategoryPointType = z.infer<typeof ExpenseCategoryPoint>;
export type TopProductPointType = z.infer<typeof TopProductPoint>;
export type PaymentMethodPointType = z.infer<typeof PaymentMethodPoint>;
