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
import { DashboardTrendPeriodType, OmzetTrendResponse, z } from "@repo/schemas";
import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

type OmzetTrendData = z.infer<typeof OmzetTrendResponse>["data"];

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

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatRupiahCompact(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}

export default function OmzetChart({
  data,
  period,
  onPeriodChange,
}: {
  data: OmzetTrendData;
  period: DashboardTrendPeriodType;
  onPeriodChange: (period: DashboardTrendPeriodType) => void;
}) {
  const { chartData, total } = useMemo(() => {
    const chartData = data.map((item) => ({
      date: item.date,
      online: Number(item.online),
      pos: Number(item.pos),
    }));
    const total = chartData.reduce(
      (sum, item) => sum + item.online + item.pos,
      0,
    );

    return { chartData, total };
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omzet</CardTitle>
        <CardDescription>
          Total pemasukan online & POS &mdash; {trendPeriodDescription(period)}
        </CardDescription>
        <CardAction>
          <TrendPeriodFilter value={period} onChange={onPeriodChange} />
        </CardAction>
        <p className="text-3xl font-semibold text-foreground">
          {formatRupiah(total)}
        </p>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-72 w-full">
          <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(date) => formatTrendDateLabel(date, period)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={48}
              tickFormatter={(value) => formatRupiahCompact(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    formatTrendDateLabel(String(label), period)
                  }
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
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="online"
              type="monotone"
              stackId="omzet"
              stroke="var(--color-online)"
              strokeWidth={2}
              fill="var(--color-online)"
              fillOpacity={0.1}
            />
            <Area
              dataKey="pos"
              type="monotone"
              stackId="omzet"
              stroke="var(--color-pos)"
              strokeWidth={2}
              fill="var(--color-pos)"
              fillOpacity={0.1}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
