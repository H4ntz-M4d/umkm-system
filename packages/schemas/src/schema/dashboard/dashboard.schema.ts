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

export const DashboardTrendQuerySchema = z.object({
  period: DashboardTrendPeriod.default("daily"),
});

export type DashboardTrendQueryInput = z.infer<typeof DashboardTrendQuerySchema>;

export const DashboardExpenseByCategoryQuerySchema = z.object({
  period: DashboardCategoryPeriod.default("monthly"),
});

export type DashboardExpenseByCategoryQueryInput = z.infer<
  typeof DashboardExpenseByCategoryQuerySchema
>;
