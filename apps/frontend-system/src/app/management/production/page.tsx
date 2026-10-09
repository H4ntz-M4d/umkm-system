"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import ExportButtons from "@/components/management/export-buttons";
import CardSummaryProduction from "@/components/management/production/card-summary-production";
import ProductionView from "@/components/management/production/production-view";
import { ProductionFilters } from "@/lib/queries/production/production.query";
import { useCanManageMaster } from "@/hooks/management/use-central-store";

export default function Page() {
  const searchParams = useSearchParams();
  /// Produksi hanya terjadi di rumah produksi, jadi pengelolaannya pun milik
  /// pusat — termasuk Gudang, yang harus bertugas di toko pusat.
  const canManage = useCanManageMaster();

  const filters: ProductionFilters = {
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  };

  /// Filter yang sedang aktif ikut dibawa ke ekspor dan cetak, tanpa paginasi.
  const activeParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value) as [string, string][],
  ).toString();

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold">Produksi</h1>
          <p className="text-sm text-muted-foreground">
            Satu batch memuat beberapa varian sekaligus. Hasilnya dicatat
            bertahap setiap kali toko produksi mengantar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            excelPath={`v1/production/export?${activeParams}`}
            fallbackName="produksi.xlsx"
            printPath={`/management/production/print?${activeParams}`}
          />
          {canManage && (
            <Button className="gap-2" asChild>
              <Link href="/management/production/new">
                <Plus className="h-4 w-4" />
                Batch Baru
              </Link>
            </Button>
          )}
        </div>
      </div>

      <CardSummaryProduction />
      <ProductionView filters={filters} />
      <Toaster />
    </main>
  );
}
