import {
  fetchExpenseByCategoryReport,
  fetchPaymentMethods,
  fetchReportSummary,
  fetchRevenueVsExpense,
  fetchTopProducts,
  ReportFilters,
} from "@/lib/queries/reports/reports.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * Seluruh kartu laporan ditarik dari satu filter yang sama, jadi hook ini
 * menampung kelimanya sekaligus dan `filters` ikut jadi bagian queryKey.
 *
 * `keepPreviousData` dipakai supaya mengubah rentang tanggal tidak membuat
 * seluruh halaman berkedip kembali ke skeleton: render lama ditahan sampai data
 * baru siap, dan kartu hanya diredupkan lewat `isFetching`.
 */
export const useReportsOperation = (filters: ReportFilters) => {
  const summaryQuery = useQuery({
    queryKey: ["reports-summary", filters],
    queryFn: () => fetchReportSummary(filters),
    placeholderData: keepPreviousData,
  });

  const revenueExpenseQuery = useQuery({
    queryKey: ["reports-revenue-vs-expense", filters],
    queryFn: () => fetchRevenueVsExpense(filters),
    placeholderData: keepPreviousData,
  });

  const expenseCategoryQuery = useQuery({
    queryKey: ["reports-expense-by-category", filters],
    queryFn: () => fetchExpenseByCategoryReport(filters),
    placeholderData: keepPreviousData,
  });

  const topProductsQuery = useQuery({
    queryKey: ["reports-top-products", filters],
    queryFn: () => fetchTopProducts(filters),
    placeholderData: keepPreviousData,
  });

  const paymentMethodsQuery = useQuery({
    queryKey: ["reports-payment-methods", filters],
    queryFn: () => fetchPaymentMethods(filters),
    placeholderData: keepPreviousData,
  });

  return {
    summaryData: summaryQuery.data?.data,
    isLoadingSummary: summaryQuery.isLoading,
    isFetchingSummary: summaryQuery.isFetching,

    revenueExpenseData: revenueExpenseQuery.data?.data,
    isLoadingRevenueExpense: revenueExpenseQuery.isLoading,
    isFetchingRevenueExpense: revenueExpenseQuery.isFetching,

    expenseCategoryData: expenseCategoryQuery.data?.data,
    isLoadingExpenseCategory: expenseCategoryQuery.isLoading,
    isFetchingExpenseCategory: expenseCategoryQuery.isFetching,

    topProductsData: topProductsQuery.data?.data,
    isLoadingTopProducts: topProductsQuery.isLoading,
    isFetchingTopProducts: topProductsQuery.isFetching,

    paymentMethodsData: paymentMethodsQuery.data?.data,
    isLoadingPaymentMethods: paymentMethodsQuery.isLoading,
    isFetchingPaymentMethods: paymentMethodsQuery.isFetching,
  };
};
