"use client";

import {
  formatTrendDateLabel,
  trendPeriodDescription,
} from "@/components/management/dashboard/format-trend-label";
import { TrendPeriodFilter } from "@/components/management/dashboard/period-filter";
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
import { DashboardTrendPeriodType, OrderTrendResponse, z } from "@repo/schemas";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type OrderTrendData = z.infer<typeof OrderTrendResponse>["data"];

const chartConfig = {
  online: {
    label: "Online",
    theme: { light: "#2a78d6", dark: "#3987e5" },
  },
  pos: {
    label: "POS",
    theme: { light: "#eb6834", dark: "#d95926" },
  },
} satisfies ChartConfig;

export default function OrderTrendChart({
  data,
  period,
  onPeriodChange,
}: {
  data: OrderTrendData;
  period: DashboardTrendPeriodType;
  onPeriodChange: (period: DashboardTrendPeriodType) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Order</CardTitle>
        <CardDescription>
          Jumlah order online dan POS &mdash; {trendPeriodDescription(period)}
        </CardDescription>
        <CardAction>
          <TrendPeriodFilter value={period} onChange={onPeriodChange} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-80 w-full">
          <LineChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(date) => formatTrendDateLabel(date, period)}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={28}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    formatTrendDateLabel(String(label), period)
                  }
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="online"
              type="monotone"
              stroke="var(--color-online)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-online)" }}
              activeDot={{ r: 4 }}
            />
            <Line
              dataKey="pos"
              type="monotone"
              stroke="var(--color-pos)"
              strokeWidth={2}
              dot={{ r: 4, fill: "var(--color-pos)" }}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
