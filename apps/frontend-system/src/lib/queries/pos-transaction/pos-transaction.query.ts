import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  PosTransactionResponse,
  PosTransactionResponseMutation,
  PosTransactionSchemaInput,
  PosTransactionsParkedResponse,
} from "@repo/schemas";

export interface PosTransactionFilters {
  page?: number;
  limit?: number;
  search?: string;
  paymentChannel?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchPosTransactions = async (filters: PosTransactionFilters) => {
  const filter = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== undefined || v !== ""),
  );
  const queryFilters = new URLSearchParams(filter);
  return await apiFetcher(
    managementApi.get(`v1/pos-transactions/${queryFilters}`),
    PosTransactionResponse,
  );
};

export const fetchPosTransactionParked = async () => {
  return await apiFetcher(
    managementApi.get("v1/pos-transactions/parked"),
    PosTransactionsParkedResponse,
  );
};

export const mutatePosTransaction = async (data: PosTransactionSchemaInput) => {
  return await apiFetcher(
    managementApi.post("v1/pos-transactions", { json: data }),
    PosTransactionResponseMutation,
  );
};

export const cancelPosTransaction = async (transId: string[]) => {
  return await managementApi
    .patch("v1/pos-transactions/cancelled", { json: transId })
    .json();
};
