"use client";

import ExportButtons from "@/components/management/export-buttons";
import LowStockView from "@/components/management/low-stock/low-stock-view";
import { LowStockFilters } from "@/lib/queries/inventory-ledgers/low-stock.query";
import { LOW_STOCK_THRESHOLD } from "@repo/schemas";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const filters: LowStockFilters = {
    skip: (page - 1) * limit,
    limit: limit,
    search: searchParams.get("search") || "",
    storeId: searchParams.get("storeId") || "",
  };

  /// Ekspor dan cetak membawa filter yang sedang aktif, tapi tidak membawa
  /// paginasi — keduanya sengaja mengambil seluruh baris hasil filter.
  const activeParams = new URLSearchParams(
    Object.entries({
      search: filters.search,
      storeId: filters.storeId,
    }).filter(([, value]) => value) as [string, string][],
  ).toString();

  return (
    <main className="flex flex-1 flex-col gap-4 py-4 px-6 pt-0">
      <div className="my-5 flex flex-row justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-instrument">Stok Rendah</h2>
          <p className="text-sm text-accent-foreground">
            Varian produk dengan sisa stok di bawah {LOW_STOCK_THRESHOLD},
            diurutkan dari yang paling sedikit
          </p>
        </div>
        <ExportButtons
          excelPath={`v1/inventory-ledger/low-stock/export?${activeParams}`}
          fallbackName="stok-rendah"
          printPath={`/management/low-stock/print?${activeParams}`}
        />
      </div>
      <LowStockView filters={filters} />
    </main>
  );
}
