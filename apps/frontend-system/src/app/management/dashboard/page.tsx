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
import { cookies, headers } from "next/headers";
import { getRoleFromToken } from "@/lib/auth/token-role";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  /// Dibaca dari token, sama seperti sidebar, supaya kartu yang hanya boleh
  /// dilihat sebagian role tidak bergantung pada pemuatan profil.
  const cookieStore = await cookies();
  const headerStore = await headers();
  const role = getRoleFromToken(
    headerStore.get("x-access-token-admin") ||
      cookieStore.get("access_token_admin")?.value,
  );

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
      <DashboardView role={role} />
    </HydrationBoundary>
  );
}
