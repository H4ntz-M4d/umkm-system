import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import { OrderResponse } from "@repo/schemas";

export interface OrderFilters {
  store?: string;
  status?: string;
  search?: string;
}

export const fetchOrders = async (
  pageIndex = 0,
  pageSize = 10,
  filters?: OrderFilters,
) => {
  const skip = pageIndex * pageSize;
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(pageSize),
    ...(filters?.store && { store: filters.store }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.search && { search: filters.search }),
  });

  return await apiFetcher(
    managementApi.get(`v1/orders?${params.toString()}`),
    OrderResponse,
  );
};

export const cancelOrder = async (orderId: string[]) => {
  return await managementApi
    .patch("v1/orders/cancelled", { json: orderId })
    .json();
};
