"use client";

import { ReactNode, useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ReportCardProps {
  title: string;
  /// Satu kalimat yang menyatakan kesimpulannya, bukan sekadar mengulang judul.
  description: string;
  chart: ReactNode;
  table: ReactNode;
  isLoading: boolean;
  isFetching: boolean;
}

/**
 * Pembungkus bersama semua kartu laporan.
 *
 * Setiap grafik wajib punya padanan tabel. Alasannya rangkap: warna seri di mode
 * terang berada di bawah rasio kontras 3:1, yang menuntut penyeimbang berupa
 * nilai yang terbaca; dan tabel inilah yang isinya sama dengan hasil ekspor,
 * sehingga yang dilihat di layar dan yang diunduh tidak bisa berbeda.
 */
export default function ReportCard({
  title,
  description,
  chart,
  table,
  isLoading,
  isFetching,
}: ReportCardProps) {
  const [view, setView] = useState<"chart" | "table">("chart");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="print:hidden">
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={view === "chart" ? "secondary" : "ghost"}
              onClick={() => setView("chart")}
              aria-pressed={view === "chart"}
              aria-label="Tampilkan grafik"
            >
              <BarChart3 className="size-4" />
            </Button>
            <Button
              size="sm"
              variant={view === "table" ? "secondary" : "ghost"}
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              aria-label="Tampilkan tabel"
            >
              <Table2 className="size-4" />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-xl" />
        ) : (
          /**
           * Saat filter berubah, render lama ditahan dan hanya diredupkan.
           * Mengganti dengan skeleton akan membuat seluruh halaman berkedip dan
           * melompat tiap kali tanggal digeser.
           */
          <div
            className={cn(
              "transition-opacity",
              isFetching && "pointer-events-none opacity-60",
            )}
          >
            {view === "chart" ? chart : table}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
