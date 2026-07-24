import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  SummaryTransactionResponse,
  TransactionFlowResponse,
} from "@repo/schemas";

export interface TransactionFlowFilter {
  page?: number;
  limit?: number;
  type?: string;
  source?: string;
  store?: string;
}
export const fetchTransactionFlow = async (filters: TransactionFlowFilter) => {
  const filter = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const cleanFilters = new URLSearchParams(filter).toString();
  const res = await apiFetcher(
    managementApi.get(`v1/transaction-flow?${cleanFilters}`),
    TransactionFlowResponse,
  );

  return res;
};

export const fetchTransactionFlowSummary = async () => {
  return await apiFetcher(
    managementApi.get(`v1/transaction-flow/summary`),
    SummaryTransactionResponse,
  );
};
