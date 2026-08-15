"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TopProductPointType } from "@repo/schemas";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toIDR } from "../../../../utils/format-money";
import { ReportTable } from "./report-table";

/// Biru untuk online dan oranye untuk kasir, sama persis dengan grafik omzet di
/// dashboard — satu kanal selalu berwarna sama di seluruh sistem.
const chartConfig = {
  pos: { label: "Kasir", theme: { light: "#eb6834", dark: "#d95926" } },
  online: { label: "Online", theme: { light: "#2a78d6", dark: "#3987e5" } },
} satisfies ChartConfig;

function shortLabel(item: TopProductPointType) {
  return item.variantLabel
    ? `${item.productName} · ${item.variantLabel}`
    : item.productName;
}

/**
 * Batang horizontal karena nama produk panjang; ditulis mendatar di sumbu
 * vertikal jauh lebih terbaca daripada dimiringkan di bawah sumbu.
 *
 * Ditumpuk, bukan berdampingan: yang ditanyakan adalah total keterserapan
 * sebuah varian, dan komposisi kasir/online adalah rinciannya — bukan dua hal
 * yang perlu dibandingkan satu sama lain.
 */
export function TopProductsChart({ data }: { data: TopProductPointType[] }) {
  const chartData = data.map((item) => ({
    name: shortLabel(item),
    pos: item.quantityPos,
    online: item.quantityOnline,
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(240, chartData.length * 46) }}
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 12, right: 24 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={210}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {/* Celah 2px antar segmen tumpukan memakai warna surface, bukan garis
            tepi — pemisah yang tidak menambah bobot visual. */}
        <Bar
          dataKey="pos"
          stackId="qty"
          fill="var(--color-pos)"
          maxBarSize={26}
          stroke="var(--color-card)"
          strokeWidth={2}
        />
        <Bar
          dataKey="online"
          stackId="qty"
          fill="var(--color-online)"
          radius={[0, 4, 4, 0]}
          maxBarSize={26}
          stroke="var(--color-card)"
          strokeWidth={2}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function TopProductsTable({ data }: { data: TopProductPointType[] }) {
  return (
    <ReportTable
      headers={["Produk", "SKU", "Kasir", "Online", "Total", "Nilai"]}
      rows={data.map((item) => [
        shortLabel(item),
        item.sku,
        item.quantityPos,
        item.quantityOnline,
        item.quantityTotal,
        toIDR(item.revenueTotal),
      ])}
    />
  );
}
