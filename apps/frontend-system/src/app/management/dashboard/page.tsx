import DashboardView from "@/components/management/dashboard/view";
import {
  DASHBOARD_QUERY_STALE_TIME,
  fetchExpenseByCategory,
  fetchOmzetTrend,
  fetchOrderTrend,
  fetchProductionStatus,
} from "@/lib/queries/dashboard/dashboard.query";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["dashboard-order-trend", "daily"],
      queryFn: () => fetchOrderTrend("daily"),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-expense-by-category", "monthly"],
      queryFn: () => fetchExpenseByCategory("monthly"),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-production-status"],
      queryFn: () => fetchProductionStatus(),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    }),
    queryClient.prefetchQuery({
      queryKey: ["dashboard-omzet-trend", "daily"],
      queryFn: () => fetchOmzetTrend("daily"),
      staleTime: DASHBOARD_QUERY_STALE_TIME,
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardView />
    </HydrationBoundary>
  );
}
