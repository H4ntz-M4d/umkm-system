"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ProductionStatusResponse, z } from "@repo/schemas";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

type ProductionStatusData = z.infer<typeof ProductionStatusResponse>["data"];

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Direncanakan",
  IN_PROGRESS: "Diproses",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const chartConfig = {
  PLANNED: { label: "Direncanakan", theme: { light: "#2a78d6", dark: "#3987e5" } },
  IN_PROGRESS: { label: "Diproses", theme: { light: "#eb6834", dark: "#d95926" } },
  COMPLETED: { label: "Selesai", theme: { light: "#1baf7a", dark: "#199e70" } },
  CANCELLED: { label: "Dibatalkan", theme: { light: "#eda100", dark: "#c98500" } },
} satisfies ChartConfig;

export default function ProductionStatusChart({
  data,
}: {
  data: ProductionStatusData;
}) {
  const chartData = data.map((item) => ({
    ...item,
    label: STATUS_LABEL[item.status] ?? item.status,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Produksi</CardTitle>
        <CardDescription>Jumlah produksi per status (all-time)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-80 w-full">
          <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {chartData.map((item) => (
                <Cell key={item.status} fill={`var(--color-${item.status})`} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
