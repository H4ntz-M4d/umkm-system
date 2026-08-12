import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import { LowStockResponse } from "@repo/schemas";

export interface LowStockFilters {
  skip?: number;
  limit?: number;
  search?: string;
  storeId?: string;
}

export const fetchLowStock = async (filters: LowStockFilters) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== ""),
  );
  const queryFilters = new URLSearchParams(
    cleanFilters as Record<string, string>,
  ).toString();

  return await apiFetcher(
    managementApi.get(`v1/inventory-ledger/low-stock?${queryFilters}`),
    LowStockResponse,
  );
};
