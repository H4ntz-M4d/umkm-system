"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RevenueExpensePointType } from "@repo/schemas";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toIDR, toIDRCompact } from "../../../../utils/format-money";
import { ReportTable } from "./report-table";
import { monthLabel } from "./month-label";

/**
 * Warna mengikuti entitas dan konsisten dengan grafik lain di halaman ini —
 * hijau selalu pemasukan, amber selalu pengeluaran, dan tidak dipakai untuk hal
 * lain. Palet ini sudah divalidasi terhadap surface terang maupun gelap.
 */
const chartConfig = {
  revenue: {
    label: "Pemasukan",
    theme: { light: "#1baf7a", dark: "#199e70" },
  },
  expense: {
    label: "Pengeluaran",
    theme: { light: "#eda100", dark: "#c98500" },
  },
} satisfies ChartConfig;

export function RevenueExpenseChart({
  data,
}: {
  data: RevenueExpensePointType[];
}) {
  const chartData = data.map((item) => ({
    period: item.period,
    label: monthLabel(item.period),
    revenue: Number(item.revenue),
    expense: Number(item.expense),
    revenuePos: Number(item.revenuePos),
    revenueOnline: Number(item.revenueOnline),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full">
      <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={(value) => toIDRCompact(value as number)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span className="flex w-full justify-between gap-4">
                  <span className="text-muted-foreground">
                    {chartConfig[name as keyof typeof chartConfig]?.label ??
                      name}
                  </span>
                  <span className="font-medium">{toIDR(value as number)}</span>
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {/* Batang berdampingan, bukan ditumpuk: tinggi yang berangkat dari
            garis dasar yang sama jauh lebih mudah dibandingkan mata. Rincian
            kasir/online dibawa ke tabel, bukan ditumpuk ke dalam batang. */}
        <Bar
          dataKey="revenue"
          fill="var(--color-revenue)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={[4, 4, 0, 0]}
          maxBarSize={32}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function RevenueExpenseTable({
  data,
}: {
  data: RevenueExpensePointType[];
}) {
  return (
    <ReportTable
      headers={[
        "Bulan",
        "Kasir",
        "Online",
        "Pemasukan",
        "Pengeluaran",
        "Selisih",
      ]}
      rows={data.map((item) => [
        monthLabel(item.period),
        toIDR(item.revenuePos),
        toIDR(item.revenueOnline),
        toIDR(item.revenue),
        toIDR(item.expense),
        toIDR(Number(item.revenue) - Number(item.expense)),
      ])}
    />
  );
}
