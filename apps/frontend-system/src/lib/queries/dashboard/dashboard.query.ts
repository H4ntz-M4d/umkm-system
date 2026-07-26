import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  DashboardCategoryPeriodType,
  DashboardTrendPeriodType,
  ExpenseByCategoryResponse,
  OmzetTrendResponse,
  OrderTrendResponse,
  ProductionStatusResponse,
} from "@repo/schemas";

export const DASHBOARD_QUERY_STALE_TIME = 60 * 1000;

export const fetchOrderTrend = async (period: DashboardTrendPeriodType) => {
  const res = await apiFetcher(
    managementApi.get(`v1/dashboard/order-trend?period=${period}`),
    OrderTrendResponse,
  );

  return res.data;
};

export const fetchOmzetTrend = async (period: DashboardTrendPeriodType) => {
  const res = await apiFetcher(
    managementApi.get(`v1/dashboard/omzet-trend?period=${period}`),
    OmzetTrendResponse,
  );

  return res.data;
};

export const fetchExpenseByCategory = async (
  period: DashboardCategoryPeriodType,
) => {
  const res = await apiFetcher(
    managementApi.get(`v1/dashboard/expense-by-category?period=${period}`),
    ExpenseByCategoryResponse,
  );

  return res.data;
};

export const fetchProductionStatus = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/dashboard/production-status"),
    ProductionStatusResponse,
  );

  return res.data;
};
