"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useReportsOperation } from "@/hooks/management/reports/use-reports-operation";
import { ReportFilters } from "@/lib/queries/reports/reports.query";
import SummaryTiles from "@/components/management/reports/summary-tiles";
import {
  RevenueExpenseChart,
  RevenueExpenseTable,
} from "@/components/management/reports/revenue-expense-chart";
import {
  ExpenseCategoryChart,
  ExpenseCategoryTable,
} from "@/components/management/reports/expense-category-chart";
import {
  TopProductsChart,
  TopProductsTable,
} from "@/components/management/reports/top-products-chart";
import {
  PaymentMethodChart,
  PaymentMethodTable,
} from "@/components/management/reports/payment-method-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

/**
 * Versi cetak: seluruh laporan tersusun berurutan tanpa tab, karena dokumen
 * yang dicetak harus utuh — pembaca kertas tidak bisa mengklik tab.
 *
 * Berada di bawah `/management/reports` supaya otomatis mewarisi pembatasan
 * role rute induknya; tidak perlu didaftarkan terpisah dan tidak mungkin
 * bocor karena lupa didaftarkan.
 */
function PrintSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    /// `break-inside-avoid` menjaga satu bagian tidak terbelah antar halaman.
    <Card className="break-inside-avoid">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export default function Page() {
  const searchParams = useSearchParams();

  const filters: ReportFilters = {
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    storeId: searchParams.get("storeId") || "",
  };

  const {
    summaryData,
    isLoadingSummary,
    revenueExpenseData,
    isLoadingRevenueExpense,
    expenseCategoryData,
    isLoadingExpenseCategory,
    topProductsData,
    isLoadingTopProducts,
    paymentMethodsData,
    isLoadingPaymentMethods,
  } = useReportsOperation(filters);

  const isReady =
    !isLoadingSummary &&
    !isLoadingRevenueExpense &&
    !isLoadingExpenseCategory &&
    !isLoadingTopProducts &&
    !isLoadingPaymentMethods;

  const hasPrinted = useRef(false);

  useEffect(() => {
    if (!isReady || hasPrinted.current) return;

    /**
     * Dialog cetak dibuka sendiri, tapi hanya setelah semua data selesai dimuat
     * — kalau tidak, yang tercetak adalah kartu kosong. Jeda singkat memberi
     * kesempatan recharts menggambar SVG-nya sebelum jendela cetak mengambil
     * cuplikan halaman.
     */
    hasPrinted.current = true;
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, [isReady]);

  const periode = summaryData
    ? `${summaryData.range.dateFrom} s/d ${summaryData.range.dateTo}`
    : "";

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-5 px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-instrument text-3xl">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground">Periode {periode}</p>
          <p className="text-xs text-muted-foreground">
            Pemasukan dihitung dari transaksi lunas dan tidak termasuk ongkos
            kirim.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Printer className="size-4" />
          Cetak
        </Button>
      </header>

      <SummaryTiles data={summaryData} isLoading={isLoadingSummary} />

      <PrintSection title="Pemasukan dan pengeluaran per bulan">
        <RevenueExpenseChart data={revenueExpenseData ?? []} />
        <RevenueExpenseTable data={revenueExpenseData ?? []} />
      </PrintSection>

      <PrintSection title="Pengeluaran per kategori">
        <ExpenseCategoryChart data={expenseCategoryData ?? []} />
        <ExpenseCategoryTable data={expenseCategoryData ?? []} />
      </PrintSection>

      <PrintSection title="Metode pembayaran">
        <PaymentMethodChart data={paymentMethodsData ?? []} />
        <PaymentMethodTable data={paymentMethodsData ?? []} />
      </PrintSection>

      <PrintSection title="Produk paling banyak terjual">
        <TopProductsChart data={topProductsData ?? []} />
        <TopProductsTable data={topProductsData ?? []} />
      </PrintSection>
    </main>
  );
}
