import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import { InventoryLedgerResponse, SummaryResponse } from "@repo/schemas";

export interface LedgerFilters {
  skip?: number;
  limit?: number;
  search?: string;
  itemType?: string;
  direction?: string;
  source?: string;
}

export const getSummary = async () => {
  const res = await apiFetcher(
    managementApi.get(`api/v1/inventory-ledger/summary`),
    SummaryResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const fetchInventoryLedger = async (filters: LedgerFilters) => {
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== ""),
  );
  const queryFilters = new URLSearchParams(cleanFilters).toString();
  const res = await apiFetcher(
    managementApi.get(`api/v1/inventory-ledger?${queryFilters}`),
    InventoryLedgerResponse,
  );

  return res;
};
