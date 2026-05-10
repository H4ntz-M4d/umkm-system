import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  ExpenseListResponse,
} from "@repo/schemas";

export const fetchExpense = async (
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(
      `api/v1/expense?skip=${skip}&limit=${pageSize}&search=${search}`,
    ),
    ExpenseListResponse,
  );

  return { data: res.data, total: res.meta.total };
};
