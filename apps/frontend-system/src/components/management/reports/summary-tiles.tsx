"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportSummaryDataType } from "@repo/schemas";
import { toIDR } from "../../../../utils/format-money";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Perubahan versus periode sebelumnya, dalam persen.
 *
 * Dari nol ke angka apa pun tidak bisa dinyatakan sebagai persen (pembaginya
 * nol), jadi dikembalikan `null` dan UI menuliskan "baru" — lebih jujur daripada
 * menampilkan ∞ atau diam-diam menganggapnya 100%.
 */
function percentChange(current: string, previous: string): number | null {
  const now = Number(current);
  const before = Number(previous);

  if (before === 0) return now === 0 ? 0 : null;
  return ((now - before) / Math.abs(before)) * 100;
}

function ChangeBadge({
  change,
  /// Untuk pengeluaran, naik itu kabar buruk — jadi arah "baik" dibalik.
  higherIsBetter = true,
}: {
  change: number | null;
  higherIsBetter?: boolean;
}) {
  if (change === null) {
    return (
      <span className="text-xs text-muted-foreground">
        baru pada periode ini
      </span>
    );
  }

  const rounded = Math.round(change * 10) / 10;
  const isFlat = rounded === 0;
  const isUp = rounded > 0;
  const isGood = higherIsBetter ? isUp : !isUp;

  const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        isFlat
          ? "text-muted-foreground"
          : isGood
            ? "text-secondary"
            : "text-destructive",
      )}
    >
      <Icon className="size-3.5" />
      {isFlat
        ? "tidak berubah"
        : `${Math.abs(rounded)}% dari periode sebelumnya`}
    </span>
  );
}

function Tile({
  label,
  hint,
  value,
  change,
  higherIsBetter,
}: {
  label: string;
  hint?: string;
  value: string;
  change: number | null;
  higherIsBetter?: boolean;
}) {
  return (
    <Card className="bg-primary-foreground">
      <CardContent className="space-y-1.5 px-5 py-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        {/* Angka utama pakai sans biasa dan angka proporsional — tabular-nums
            membuat angka besar terlihat renggang. */}
        <p className="text-3xl font-semibold">{toIDR(value)}</p>
        <ChangeBadge change={change} higherIsBetter={higherIsBetter} />
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function SummaryTiles({
  data,
  isLoading,
}: {
  data?: ReportSummaryDataType;
  isLoading: boolean;
}) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <Skeleton key={key} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Tile
        label="Pemasukan"
        hint={`Kasir ${toIDR(data.revenuePos.current)} · Online ${toIDR(
          data.revenueOnline.current,
        )}`}
        value={data.revenue.current}
        change={percentChange(data.revenue.current, data.revenue.previous)}
      />
      <Tile
        label="Pengeluaran"
        value={data.expense.current}
        change={percentChange(data.expense.current, data.expense.previous)}
        higherIsBetter={false}
      />
      <Tile
        label="Selisih"
        hint="Pemasukan dikurangi pengeluaran"
        value={data.balance.current}
        change={percentChange(data.balance.current, data.balance.previous)}
      />
    </div>
  );
}
