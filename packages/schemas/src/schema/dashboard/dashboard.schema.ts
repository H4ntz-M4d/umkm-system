import z from "zod";

export const DashboardTrendPeriod = z.enum([
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);
export type DashboardTrendPeriodType = z.infer<typeof DashboardTrendPeriod>;

export const DashboardCategoryPeriod = z.enum(["monthly", "yearly"]);
export type DashboardCategoryPeriodType = z.infer<
  typeof DashboardCategoryPeriod
>;

/**
 * Cakupan toko untuk dashboard.
 *
 * Kosong berarti "bawaan" — server yang memutuskan: akun yang terikat toko
 * dikunci ke tokonya, akun pusat mendapat toko pusat. Nilai khusus "all"
 * meminta gabungan seluruh toko, dan itu hanya dilayani untuk akun pusat.
 *
 * Bentuk ini dipilih supaya layar tidak perlu tahu aturannya: yang dikirim
 * hanya keinginan, sedangkan yang berhak memutuskan tetap server.
 */
export const DashboardStoreScope = z.string().optional();

export const DashboardTrendQuerySchema = z.object({
  period: DashboardTrendPeriod.default("daily"),
  storeId: DashboardStoreScope,
});

export type DashboardTrendQueryInput = z.infer<typeof DashboardTrendQuerySchema>;

export const DashboardExpenseByCategoryQuerySchema = z.object({
  period: DashboardCategoryPeriod.default("monthly"),
  storeId: DashboardStoreScope,
});

export const DashboardScopeQuerySchema = z.object({
  storeId: DashboardStoreScope,
});

export type DashboardScopeQueryInput = z.infer<
  typeof DashboardScopeQuerySchema
>;

export type DashboardExpenseByCategoryQueryInput = z.infer<
  typeof DashboardExpenseByCategoryQuerySchema
>;
