import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  SummaryResponseAmountPosAndOrder,
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
  // Indeks halaman diubah jadi `skip` di sini, sama seperti fetchProducts dan
  // fetchOrders — backend menerima `skip`/`limit` lewat Pagination.
  const { page, ...rest } = filters;
  const limit = rest.limit ?? 10;

  const filter = Object.fromEntries(
    Object.entries({ ...rest, limit, skip: (page ?? 0) * limit })
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
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

export const fetchTransactionFlowSummaryAmountPosAndOrder = async () => {
  return await apiFetcher(
    managementApi.get(
      `v1/transaction-flow/summary-amount-pos-and-order-transaction`,
    ),
    SummaryResponseAmountPosAndOrder,
  );
};
