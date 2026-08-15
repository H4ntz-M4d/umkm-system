"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ExpenseCategoryPointType } from "@repo/schemas";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { toIDR, toIDRCompact } from "../../../../utils/format-money";
import { ReportTable } from "./report-table";

const chartConfig = {
  total: { label: "Pengeluaran" },
} satisfies ChartConfig;

/**
 * Bar horizontal, bukan donut seperti di dashboard.
 *
 * Pertanyaan yang dibawa ke laporan adalah "kategori mana yang paling besar dan
 * seberapa jauh jaraknya" — membandingkan panjang batang jauh lebih akurat
 * daripada membandingkan sudut irisan, terlebih saat nilainya berdekatan.
 * Warnanya diambil dari kolom `color` milik kategori sehingga sebuah kategori
 * selalu berwarna sama di mana pun ia muncul.
 */
export function ExpenseCategoryChart({
  data,
}: {
  data: ExpenseCategoryPointType[];
}) {
  const chartData = data.map((item) => ({
    name: item.categoryName,
    total: Number(item.total),
    color: item.color,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(220, chartData.length * 44) }}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 12, right: 56 }}
      >
        <XAxis
          type="number"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => toIDRCompact(value as number)}
        />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={140}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <span className="font-medium">{toIDR(value as number)}</span>
              )}
            />
          }
        />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28}>
          {chartData.map((item) => (
            <Cell key={item.name} fill={item.color} />
          ))}
          {/* Nilai ditulis di ujung batang: warna kategori bisa berada di bawah
              rasio kontras aman, jadi angkanya tidak boleh hanya ada di tooltip. */}
          <LabelList
            dataKey="total"
            position="right"
            className="fill-foreground text-xs"
            formatter={(value) =>
              value == null ? "" : toIDRCompact(value as number)
            }
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function ExpenseCategoryTable({
  data,
}: {
  data: ExpenseCategoryPointType[];
}) {
  const total = data.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <ReportTable
      headers={["Kategori", "Total", "Porsi"]}
      rows={data.map((item) => [
        item.categoryName,
        toIDR(item.total),
        total > 0
          ? `${((Number(item.total) / total) * 100).toFixed(1)}%`
          : "0%",
      ])}
    />
  );
}
