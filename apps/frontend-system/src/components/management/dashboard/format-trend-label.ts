import { DashboardTrendPeriodType } from "@repo/schemas";

const TREND_DESCRIPTION: Record<DashboardTrendPeriodType, string> = {
  daily: "Per hari, bulan berjalan",
  weekly: "Per minggu, 3 bulan terakhir",
  monthly: "Per bulan, tahun berjalan",
  yearly: "Per tahun, 5 tahun terakhir",
};

export function trendPeriodDescription(period: DashboardTrendPeriodType) {
  return TREND_DESCRIPTION[period];
}

export function formatTrendDateLabel(
  date: string,
  period: DashboardTrendPeriodType,
) {
  const parsed = new Date(`${date}T00:00:00`);

  if (period === "yearly") {
    return parsed.getFullYear().toString();
  }

  if (period === "monthly") {
    return parsed.toLocaleDateString("id-ID", { month: "short" });
  }

  // daily & weekly: tanggal harian (untuk weekly, ini tanggal awal minggu / Senin)
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}
