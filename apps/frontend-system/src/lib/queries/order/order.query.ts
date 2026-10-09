import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  OrderCancelResponse,
  OrderResponse,
  UpdateOrderNegotiationResponse,
  UpdateShipmentResponse,
  type UpdateOrderNegotiationInput,
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

/// Lewat apiFetcher supaya penolakan dari backend (mis. "Pembatalan massal
/// hanya untuk pesanan berstatus Mengajukan...") sampai utuh ke admin, bukan
/// galat HTTP generik.
export const cancelOrder = async (orderId: string[]) =>
  apiFetcher(
    managementApi.patch("v1/orders/cancelled", { json: orderId }),
    OrderCancelResponse,
  );

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

/**
 * Mencatat hasil negosiasi WhatsApp: total yang disepakati, DP yang sudah
 * masuk, dan pergeseran statusnya.
 *
 * Dibungkus apiFetcher supaya penolakan dari backend ("Nominal DP tidak boleh
 * melebihi total kesepakatan", "Pesanan ini diambil di tempat…") sampai utuh
 * ke admin, bukan jadi galat generik.
 */
export const updateOrderNegotiation = async (
  orderId: string,
  data: UpdateOrderNegotiationInput,
) => {
  return await apiFetcher(
    managementApi.patch(`v1/orders/${orderId}/negotiation`, { json: data }),
    UpdateOrderNegotiationResponse,
  );
};
