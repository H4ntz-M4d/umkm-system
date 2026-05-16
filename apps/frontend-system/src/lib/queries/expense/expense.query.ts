import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateExpenseResponse,
  ExpenseListResponse,
  ExpenseSchemaInput,
  ExpenseSummaryResponse,
  SingleExpenseResponse,
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

export const removeExpense = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`v1/expense/${id}`),
    SingleExpenseResponse,
  );

  return res;
};
