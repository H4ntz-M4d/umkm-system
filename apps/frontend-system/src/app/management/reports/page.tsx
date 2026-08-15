"use client";

import ExportButtons from "@/components/management/export-buttons";
import ReportsView from "@/components/management/reports/reports-view";
import { ReportFilters } from "@/lib/queries/reports/reports.query";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();

  const filters: ReportFilters = {
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    storeId: searchParams.get("storeId") || "",
  };

  /// Ekspor dan cetak membawa filter yang sedang aktif, sehingga berkas yang
  /// keluar selalu menggambarkan periode yang sama dengan yang di layar.
  const activeParams = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value) as [string, string][],
  ).toString();

  return (
    <main className="flex flex-1 flex-col gap-4 px-6 py-4 pt-0">
      <div className="my-5 flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-instrument text-4xl">Laporan</h2>
          <p className="text-sm text-accent-foreground">
            Ringkasan keuangan dan penjualan. Pemasukan dihitung dari transaksi
            yang sudah lunas dan tidak termasuk ongkos kirim, sehingga angkanya
            bisa berbeda dari dashboard.
          </p>
        </div>
        <ExportButtons
          excelPath={`v1/reports/export?${activeParams}`}
          fallbackName="laporan"
          printPath={`/management/reports/print?${activeParams}`}
        />
      </div>
      <ReportsView filters={filters} />
    </main>
  );
}
