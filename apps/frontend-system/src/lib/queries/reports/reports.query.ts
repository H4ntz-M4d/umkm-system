import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  ExpenseByCategoryReportResponse,
  PaymentMethodsResponse,
  ReportSummaryResponse,
  RevenueExpenseResponse,
  TopProductsResponse,
} from "@repo/schemas";

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  storeId?: string;
}

function toQueryString(filters: ReportFilters & { limit?: number }) {
  const clean = Object.fromEntries(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  return new URLSearchParams(clean).toString();
}

export const fetchReportSummary = async (filters: ReportFilters) =>
  await apiFetcher(
    managementApi.get(`v1/reports/summary?${toQueryString(filters)}`),
    ReportSummaryResponse,
  );

export const fetchRevenueVsExpense = async (filters: ReportFilters) =>
  await apiFetcher(
    managementApi.get(
      `v1/reports/revenue-vs-expense?${toQueryString(filters)}`,
    ),
    RevenueExpenseResponse,
  );

export const fetchExpenseByCategoryReport = async (filters: ReportFilters) =>
  await apiFetcher(
    managementApi.get(
      `v1/reports/expense-by-category?${toQueryString(filters)}`,
    ),
    ExpenseByCategoryReportResponse,
  );

export const fetchTopProducts = async (filters: ReportFilters, limit = 10) =>
  await apiFetcher(
    managementApi.get(
      `v1/reports/top-products?${toQueryString({ ...filters, limit })}`,
    ),
    TopProductsResponse,
  );

export const fetchPaymentMethods = async (filters: ReportFilters) =>
  await apiFetcher(
    managementApi.get(`v1/reports/payment-methods?${toQueryString(filters)}`),
    PaymentMethodsResponse,
  );
