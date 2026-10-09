import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateExpenseResponse,
  ExpenseListResponse,
  ExpenseProofsResponse,
  ExpenseSchemaInput,
  ExpenseSummaryResponse,
  SingleExpenseResponse,
  UpdateExpenseResponse,
} from "@repo/schemas";

export interface ExpenseFilters {
  skip?: number;
  limit?: number;
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}
export const fetchExpense = async (filter: ExpenseFilters) => {
  const filters = Object.fromEntries(
    Object.entries(filter).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const queryFilter = new URLSearchParams(filters).toString();
  const res = await apiFetcher(
    managementApi.get(`v1/expense?${queryFilter}`),
    ExpenseListResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const fetchExpenseSummary = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/expense/summary"),
    ExpenseSummaryResponse,
  );

  return res;
};

export const createExpense = async (data: ExpenseSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("v1/expense", { json: data }),
    CreateExpenseResponse,
  );

  return res;
};

/// Detail lengkap (item + bukti) untuk mengisi dialog saat diedit.
export const fetchExpenseDetail = async (id: string) => {
  const res = await apiFetcher(
    managementApi.get(`v1/expense/${id}`),
    SingleExpenseResponse,
  );

  return res.data;
};

export const updateExpense = async (id: string, data: ExpenseSchemaInput) => {
  const res = await apiFetcher(
    managementApi.patch(`v1/expense/${id}`, { json: data }),
    UpdateExpenseResponse,
  );

  return res;
};

/**
 * Melampirkan foto bukti.
 *
 * Batas waktunya dinaikkan jauh di atas bawaan ky (10 detik): unggahan foto
 * dari jaringan yang pas-pasan kerap lebih lama, dan yang menyerah duluan
 * adalah permintaannya — berkasnya sendiri tetap sampai, sama seperti kasus
 * bukti transfer di kasir.
 */
export const uploadExpenseProofs = async (id: string, files: File[]) => {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);

  const res = await apiFetcher(
    managementApi.post(`v1/expense/${id}/proofs`, {
      body: formData,
      timeout: 120_000,
    }),
    ExpenseProofsResponse,
  );

  return res;
};

export const removeExpenseProof = async (id: string, proofId: string) => {
  const res = await apiFetcher(
    managementApi.delete(`v1/expense/${id}/proofs/${proofId}`),
    ExpenseProofsResponse,
  );

  return res;
};

export const removeExpense = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`v1/expense/${id}`),
    SingleExpenseResponse,
  );

  return res;
};
