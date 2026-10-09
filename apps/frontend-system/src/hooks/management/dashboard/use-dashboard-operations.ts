import {
  DASHBOARD_QUERY_STALE_TIME,
  fetchExpenseByCategory,
  fetchOmzetTrend,
  fetchOrderTrend,
  fetchProductionStatus,
} from "@/lib/queries/dashboard/dashboard.query";
import {
  DashboardCategoryPeriodType,
  DashboardTrendPeriodType,
} from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";

export const useDashboardOperation = ({
  orderTrendPeriod = "daily",
  omzetTrendPeriod = "daily",
  expenseByCategoryPeriod = "monthly",
  /// Kosong = biarkan server yang menentukan (toko akun, atau toko pusat).
  /// Ikut jadi bagian queryKey supaya ganti toko benar-benar memuat ulang,
  /// bukan menampilkan angka toko sebelumnya.
  storeId = "",
}: {
  orderTrendPeriod?: DashboardTrendPeriodType;
  omzetTrendPeriod?: DashboardTrendPeriodType;
  expenseByCategoryPeriod?: DashboardCategoryPeriodType;
  storeId?: string;
} = {}) => {
  const fetchOrderTrendQuery = useQuery({
    queryKey: ["dashboard-order-trend", orderTrendPeriod, storeId],
    queryFn: () => fetchOrderTrend(orderTrendPeriod, storeId),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchOmzetTrendQuery = useQuery({
    queryKey: ["dashboard-omzet-trend", omzetTrendPeriod, storeId],
    queryFn: () => fetchOmzetTrend(omzetTrendPeriod, storeId),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchExpenseByCategoryQuery = useQuery({
    queryKey: [
      "dashboard-expense-by-category",
      expenseByCategoryPeriod,
      storeId,
    ],
    queryFn: () => fetchExpenseByCategory(expenseByCategoryPeriod, storeId),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchProductionStatusQuery = useQuery({
    queryKey: ["dashboard-production-status", storeId],
    queryFn: () => fetchProductionStatus(storeId),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  return {
    orderTrendData: fetchOrderTrendQuery.data,
    isLoadingOrderTrend: fetchOrderTrendQuery.isLoading,

    omzetTrendData: fetchOmzetTrendQuery.data,
    isLoadingOmzetTrend: fetchOmzetTrendQuery.isLoading,

    expenseByCategoryData: fetchExpenseByCategoryQuery.data,
    isLoadingExpenseByCategory: fetchExpenseByCategoryQuery.isLoading,

    productionStatusData: fetchProductionStatusQuery.data,
    isLoadingProductionStatus: fetchProductionStatusQuery.isLoading,
  };
};
