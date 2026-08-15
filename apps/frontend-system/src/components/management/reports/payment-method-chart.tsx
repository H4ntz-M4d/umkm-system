"use client";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PaymentMethodPointType } from "@repo/schemas";
import { Bar, BarChart, LabelList, XAxis, YAxis } from "recharts";
import { toIDR, toIDRCompact } from "../../../../utils/format-money";
import { ReportTable } from "./report-table";

/// Satu seri, jadi satu warna untuk semua batang. Mewarnai batang lebih gelap
/// karena lebih besar hanya mengulang informasi yang sudah dibawa panjangnya.
const chartConfig = {
  total: {
    label: "Nilai transaksi",
    theme: { light: "#2a78d6", dark: "#3987e5" },
  },
} satisfies ChartConfig;

export function PaymentMethodChart({
  data,
}: {
  data: PaymentMethodPointType[];
}) {
  const chartData = data.map((item) => ({
    name: item.paymentMethodName,
    total: Number(item.total),
  }));

  return (
    <ChartContainer
      config={chartConfig}
      className="w-full"
      style={{ height: Math.max(220, chartData.length * 46) }}
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
          width={120}
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
        <Bar
          dataKey="total"
          fill="var(--color-total)"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        >
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

export function PaymentMethodTable({
  data,
}: {
  data: PaymentMethodPointType[];
}) {
  return (
    <ReportTable
      headers={["Metode", "Jumlah transaksi", "Nilai"]}
      rows={data.map((item) => [
        item.paymentMethodName,
        item.transactionCount,
        toIDR(item.total),
      ])}
    />
  );
}
