import {
  DASHBOARD_QUERY_STALE_TIME,
  fetchExpenseByCategory,
  fetchOmzetTrend,
  fetchOrderTrend,
  fetchProductionStatus,
} from "@/lib/queries/dashboard/dashboard.query";
import { DashboardCategoryPeriodType, DashboardTrendPeriodType } from "@repo/schemas";
import { useQuery } from "@tanstack/react-query";

export const useDashboardOperation = ({
  orderTrendPeriod = "daily",
  omzetTrendPeriod = "daily",
  expenseByCategoryPeriod = "monthly",
}: {
  orderTrendPeriod?: DashboardTrendPeriodType;
  omzetTrendPeriod?: DashboardTrendPeriodType;
  expenseByCategoryPeriod?: DashboardCategoryPeriodType;
} = {}) => {
  const fetchOrderTrendQuery = useQuery({
    queryKey: ["dashboard-order-trend", orderTrendPeriod],
    queryFn: () => fetchOrderTrend(orderTrendPeriod),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchOmzetTrendQuery = useQuery({
    queryKey: ["dashboard-omzet-trend", omzetTrendPeriod],
    queryFn: () => fetchOmzetTrend(omzetTrendPeriod),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchExpenseByCategoryQuery = useQuery({
    queryKey: ["dashboard-expense-by-category", expenseByCategoryPeriod],
    queryFn: () => fetchExpenseByCategory(expenseByCategoryPeriod),
    staleTime: DASHBOARD_QUERY_STALE_TIME,
    throwOnError: true,
  });

  const fetchProductionStatusQuery = useQuery({
    queryKey: ["dashboard-production-status"],
    queryFn: () => fetchProductionStatus(),
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
