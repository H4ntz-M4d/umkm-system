"use client";

import { CategoryPeriodFilter } from "@/components/management/dashboard/period-filter";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  DashboardCategoryPeriodType,
  ExpenseByCategoryResponse,
  z,
} from "@repo/schemas";
import { useMemo } from "react";
import { Cell, Label, Pie, PieChart } from "recharts";

type ExpenseByCategoryData = z.infer<typeof ExpenseByCategoryResponse>["data"];

const OTHER_KEY = "lainnya";
const OTHER_COLOR = "#898781";
const MAX_SLICES = 5;

const PERIOD_DESCRIPTION: Record<DashboardCategoryPeriodType, string> = {
  monthly: "Bulan berjalan",
  yearly: "Tahun berjalan",
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function ExpenseCategoryChart({
  data,
  period,
  onPeriodChange,
}: {
  data: ExpenseByCategoryData;
  period: DashboardCategoryPeriodType;
  onPeriodChange: (period: DashboardCategoryPeriodType) => void;
}) {
  const { slices, chartConfig, grandTotal } = useMemo(() => {
    const parsed = data
      .map((item) => ({
        key: toSlug(item.categoryName || item.categoryId),
        name: item.categoryName,
        color: item.color,
        total: Number(item.total),
      }))
      .sort((a, b) => b.total - a.total);

    const top = parsed.slice(0, MAX_SLICES);
    const rest = parsed.slice(MAX_SLICES);
    const restTotal = rest.reduce((sum, item) => sum + item.total, 0);

    const slices =
      restTotal > 0
        ? [...top, { key: OTHER_KEY, name: "Lainnya", color: OTHER_COLOR, total: restTotal }]
        : top;

    const chartConfig = slices.reduce((config, item) => {
      config[item.key] = { label: item.name, color: item.color };
      return config;
    }, {} as ChartConfig);

    const grandTotal = parsed.reduce((sum, item) => sum + item.total, 0);

    return { slices, chartConfig, grandTotal };
  }, [data]);

  return (
    <Card className="size-full">
      <CardHeader>
        <CardTitle>Pengeluaran per Kategori</CardTitle>
        <CardDescription>{PERIOD_DESCRIPTION[period]}</CardDescription>
        <CardAction>
          <CategoryPeriodFilter value={period} onChange={onPeriodChange} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="mx-auto max-h-80 aspect-square"
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <div className="flex w-full items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {chartConfig[name as keyof typeof chartConfig]
                            ?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {formatRupiah(Number(value))}
                        </span>
                      </div>
                    </div>
                  )}
                />
              }
            />
            <Pie
              data={slices}
              dataKey="total"
              nameKey="key"
              innerRadius={70}
              strokeWidth={2}
            >
              {slices.map((slice) => (
                <Cell key={slice.key} fill={slice.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null;
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        className="fill-foreground text-lg font-semibold"
                      >
                        {formatRupiah(grandTotal)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 20}
                        className="fill-muted-foreground text-xs"
                      >
                        Total
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="key" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
