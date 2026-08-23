"use client";

import StockTransferView from "@/components/management/stock-transfer/stock-transfer-view";
import { StockTransferFilters } from "@/lib/queries/stock-transfer/stock-transfer.query";
import { TransferStatusType } from "@repo/schemas";
import { Toaster } from "@/components/ui/sonner";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;

  const filters: StockTransferFilters = {
    skip: (page - 1) * limit,
    limit: limit,
    status: (searchParams.get("status") as TransferStatusType) || "",
    toStoreId: searchParams.get("toStoreId") || "",
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-4 pt-0">
      <div className="my-5 space-y-1">
        <h2 className="font-instrument text-4xl">Distribusi Stok</h2>
        <p className="text-sm text-accent-foreground">
          Pengiriman barang dari rumah produksi ke toko lain. Stok tujuan baru
          bertambah setelah penerimaannya dikonfirmasi, sehingga barang yang
          masih dalam perjalanan tidak bisa terjual.
        </p>
      </div>
      <StockTransferView filters={filters} />
      <Toaster />
    </main>
  );
}
