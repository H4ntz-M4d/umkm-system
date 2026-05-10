import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  ExpenseCategoryListResponse,
  ExpenseCategorySchemaInput,
  SingleExpenseCategoryResponse,
} from "@repo/schemas";

export const fetchExpenseCategories = async () => {
  const res = await apiFetcher(
    managementApi.get("api/v1/expense-category"),
    ExpenseCategoryListResponse,
  );

  return { data: res.data };
};

export const createExpenseCategories = async (
  data: ExpenseCategorySchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.post("api/v1/expense-category", { json: data }),
    SingleExpenseCategoryResponse,
  );

  return res;
};

export const updateExpenseCategories = async (
  id: string,
  data: ExpenseCategorySchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.put(`api/v1/expense-category/${id}`, { json: data }),
    SingleExpenseCategoryResponse,
  );

  return res;
};

export const removeByStatus = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`api/v1/expense-category/status/${id}`),
    SingleExpenseCategoryResponse,
  );

  return res;
};

export const removePermanent = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`api/v1/expense-category/${id}`),
    SingleExpenseCategoryResponse,
  );

  return res;
};
