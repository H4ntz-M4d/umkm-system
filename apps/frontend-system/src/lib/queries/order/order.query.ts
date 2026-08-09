import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  OrderResponse,
  UpdateShipmentResponse,
  type UpdateShipmentInput,
} from "@repo/schemas";

export interface OrderFilters {
  store?: string;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
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
    ...(filters?.dateFrom && { dateFrom: filters.dateFrom }),
    ...(filters?.dateTo && { dateTo: filters.dateTo }),
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

/**
 * Pengiriman ditangani manual; status & nomor resi diperbarui admin sendiri.
 *
 * Dibungkus apiFetcher supaya pesan galat dari backend ("Pesanan belum dibayar,
 * pengiriman belum bisa diproses") sampai utuh ke pemanggil. Tanpa itu ky hanya
 * melempar HTTPError dengan pesan generik dan admin tidak tahu apa masalahnya.
 */
export const updateShipment = async (
  orderId: string,
  data: UpdateShipmentInput,
) => {
  return await apiFetcher(
    managementApi.patch(`v1/orders/${orderId}/shipment`, { json: data }),
    UpdateShipmentResponse,
  );
};
