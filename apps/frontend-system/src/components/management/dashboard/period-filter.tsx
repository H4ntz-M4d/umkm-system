"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DashboardCategoryPeriodType,
  DashboardTrendPeriodType,
} from "@repo/schemas";

const TREND_PERIOD_LABEL: Record<DashboardTrendPeriodType, string> = {
  daily: "Harian",
  weekly: "Mingguan",
  monthly: "Bulanan",
  yearly: "Tahunan",
};

const TREND_PERIOD_OPTIONS = Object.keys(
  TREND_PERIOD_LABEL,
) as DashboardTrendPeriodType[];

const CATEGORY_PERIOD_LABEL: Record<DashboardCategoryPeriodType, string> = {
  monthly: "Bulanan",
  yearly: "Tahunan",
};

const CATEGORY_PERIOD_OPTIONS = Object.keys(
  CATEGORY_PERIOD_LABEL,
) as DashboardCategoryPeriodType[];

export function TrendPeriodFilter({
  value,
  onChange,
}: {
  value: DashboardTrendPeriodType;
  onChange: (value: DashboardTrendPeriodType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as DashboardTrendPeriodType)}
    >
      <SelectTrigger size="sm" className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {TREND_PERIOD_OPTIONS.map((period) => (
          <SelectItem key={period} value={period}>
            {TREND_PERIOD_LABEL[period]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategoryPeriodFilter({
  value,
  onChange,
}: {
  value: DashboardCategoryPeriodType;
  onChange: (value: DashboardCategoryPeriodType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as DashboardCategoryPeriodType)}
    >
      <SelectTrigger size="sm" className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {CATEGORY_PERIOD_OPTIONS.map((period) => (
          <SelectItem key={period} value={period}>
            {CATEGORY_PERIOD_LABEL[period]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
