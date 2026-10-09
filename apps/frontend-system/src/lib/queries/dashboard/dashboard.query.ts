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

/**
 * Cakupan toko yang diminta layar.
 *
 * Dikirim apa adanya; server yang memutuskan boleh atau tidak. Kosong berarti
 * "terserah bawaan", "all" berarti gabungan seluruh toko.
 */
const scopeParam = (storeId?: string) =>
  storeId ? `&storeId=${encodeURIComponent(storeId)}` : "";

export const fetchOrderTrend = async (
  period: DashboardTrendPeriodType,
  storeId?: string,
) => {
  const res = await apiFetcher(
    managementApi.get(
      `v1/dashboard/order-trend?period=${period}${scopeParam(storeId)}`,
    ),
    OrderTrendResponse,
  );

  return res.data;
};

export const fetchOmzetTrend = async (
  period: DashboardTrendPeriodType,
  storeId?: string,
) => {
  const res = await apiFetcher(
    managementApi.get(
      `v1/dashboard/omzet-trend?period=${period}${scopeParam(storeId)}`,
    ),
    OmzetTrendResponse,
  );

  return res.data;
};

export const fetchExpenseByCategory = async (
  period: DashboardCategoryPeriodType,
  storeId?: string,
) => {
  const res = await apiFetcher(
    managementApi.get(
      `v1/dashboard/expense-by-category?period=${period}${scopeParam(storeId)}`,
    ),
    ExpenseByCategoryResponse,
  );

  return res.data;
};

export const fetchProductionStatus = async (storeId?: string) => {
  const res = await apiFetcher(
    managementApi.get(
      `v1/dashboard/production-status${storeId ? `?storeId=${encodeURIComponent(storeId)}` : ""}`,
    ),
    ProductionStatusResponse,
  );

  return res.data;
};
