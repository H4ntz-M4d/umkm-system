"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReportsOperation } from "@/hooks/management/reports/use-reports-operation";
import { ReportFilters } from "@/lib/queries/reports/reports.query";
import ReportsFilter from "./reports-filter";
import ReportCard from "./report-card";
import SummaryTiles from "./summary-tiles";
import {
  RevenueExpenseChart,
  RevenueExpenseTable,
} from "./revenue-expense-chart";
import {
  ExpenseCategoryChart,
  ExpenseCategoryTable,
} from "./expense-category-chart";
import { TopProductsChart, TopProductsTable } from "./top-products-chart";
import { PaymentMethodChart, PaymentMethodTable } from "./payment-method-chart";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ReportsView({ filters }: { filters: ReportFilters }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  const {
    summaryData,
    isLoadingSummary,
    revenueExpenseData,
    isLoadingRevenueExpense,
    isFetchingRevenueExpense,
    expenseCategoryData,
    isLoadingExpenseCategory,
    isFetchingExpenseCategory,
    topProductsData,
    isLoadingTopProducts,
    isFetchingTopProducts,
    paymentMethodsData,
    isLoadingPaymentMethods,
    isFetchingPaymentMethods,
  } = useReportsOperation(filters);

  /// Tab ikut disimpan di URL supaya menyegarkan halaman atau membagikan
  /// tautannya tidak melemparkan pembaca kembali ke tab pertama.
  const currentTab = searchParams.get("tab") ?? "keuangan";
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.push(`${pathName}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-1 flex-col gap-5">
      <ReportsFilter filters={filters} />

      <SummaryTiles data={summaryData} isLoading={isLoadingSummary} />

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-4 print:hidden">
          <TabsTrigger value="keuangan">Keuangan</TabsTrigger>
          <TabsTrigger value="penjualan">Penjualan</TabsTrigger>
        </TabsList>

        <TabsContent value="keuangan" className="flex flex-col gap-5">
          <ReportCard
            title="Pemasukan dan pengeluaran per bulan"
            description="Batang hijau adalah uang masuk yang sudah lunas, amber adalah uang keluar. Jarak keduanya adalah selisih bulan itu."
            isLoading={isLoadingRevenueExpense}
            isFetching={isFetchingRevenueExpense}
            chart={<RevenueExpenseChart data={revenueExpenseData ?? []} />}
            table={<RevenueExpenseTable data={revenueExpenseData ?? []} />}
          />
          <ReportCard
            title="Pengeluaran per kategori"
            description="Diurutkan dari yang terbesar, sehingga kategori yang paling menguras kas berada di paling atas."
            isLoading={isLoadingExpenseCategory}
            isFetching={isFetchingExpenseCategory}
            chart={<ExpenseCategoryChart data={expenseCategoryData ?? []} />}
            table={<ExpenseCategoryTable data={expenseCategoryData ?? []} />}
          />
          <ReportCard
            title="Metode pembayaran"
            description="Ke mana uang masuk mengalir, menggabungkan transaksi kasir dan pesanan online."
            isLoading={isLoadingPaymentMethods}
            isFetching={isFetchingPaymentMethods}
            chart={<PaymentMethodChart data={paymentMethodsData ?? []} />}
            table={<PaymentMethodTable data={paymentMethodsData ?? []} />}
          />
        </TabsContent>

        <TabsContent value="penjualan" className="flex flex-col gap-5">
          <ReportCard
            title="Produk paling banyak terjual"
            description="Sepuluh varian teratas menurut jumlah unit, dipecah antara kasir dan pesanan online."
            isLoading={isLoadingTopProducts}
            isFetching={isFetchingTopProducts}
            chart={<TopProductsChart data={topProductsData ?? []} />}
            table={<TopProductsTable data={topProductsData ?? []} />}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
