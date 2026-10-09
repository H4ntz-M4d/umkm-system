import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  BespokeOrderListResponse,
  BespokeOrderResponse,
  BespokeOrderSchemaInput,
  BespokeStatusInput,
  BespokeSummaryResponse,
} from "@repo/schemas";

export interface BespokeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const fetchBespokeOrders = async (filters: BespokeFilters) => {
  const { page, ...rest } = filters;
  const limit = rest.limit ?? 10;

  /// `page` diterjemahkan jadi `skip` di sini karena backend hanya membaca
  /// `skip`/`limit` — sama seperti daftar pesanan dan transaksi kasir.
  const params = Object.fromEntries(
    Object.entries({ ...rest, limit, skip: (page ?? 0) * limit })
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  const res = await apiFetcher(
    managementApi.get(`v1/bespoke?${new URLSearchParams(params).toString()}`),
    BespokeOrderListResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const fetchBespokeSummary = async () =>
  apiFetcher(managementApi.get("v1/bespoke/summary"), BespokeSummaryResponse);

export const createBespokeOrder = async (data: BespokeOrderSchemaInput) =>
  apiFetcher(
    managementApi.post("v1/bespoke", { json: data }),
    BespokeOrderResponse,
  );

export const updateBespokeOrder = async (
  id: string,
  data: BespokeOrderSchemaInput,
) =>
  apiFetcher(
    managementApi.put(`v1/bespoke/${id}`, { json: data }),
    BespokeOrderResponse,
  );

export const updateBespokeStatus = async (
  id: string,
  status: BespokeStatusInput,
) =>
  apiFetcher(
    managementApi.patch(`v1/bespoke/${id}/status`, { json: { status } }),
    BespokeOrderResponse,
  );

export const removeBespokeOrder = async (id: string) =>
  managementApi.delete(`v1/bespoke/${id}`).json();
