import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateProductionSchemaInput,
  ProductionDetailResponse,
  ProductionResponse,
  ProductionSummaryResponse,
  RecordDeliverySchemaInput,
} from "@repo/schemas";

export interface ProductionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchProductions = async (filters: ProductionFilters) => {
  const { page, ...rest } = filters;
  const limit = rest.limit ?? 10;

  /// `page` diterjemahkan jadi `skip`: backend hanya membaca `skip`/`limit`.
  const params = Object.fromEntries(
    Object.entries({ ...rest, limit, skip: (page ?? 0) * limit })
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  const res = await apiFetcher(
    managementApi.get(`v1/production?${new URLSearchParams(params).toString()}`),
    ProductionResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const fetchProductionSummary = async () =>
  apiFetcher(
    managementApi.get("v1/production/summary"),
    ProductionSummaryResponse,
  );

export const fetchProductionDetail = async (id: string) => {
  const res = await apiFetcher(
    managementApi.get(`v1/production/${id}`),
    ProductionDetailResponse,
  );

  return res.data;
};

export const createProduction = async (data: CreateProductionSchemaInput) =>
  apiFetcher(
    managementApi.post("v1/production", { json: data }),
    ProductionDetailResponse,
  );

export const updateProduction = async (
  id: string,
  data: CreateProductionSchemaInput,
) =>
  apiFetcher(
    managementApi.put(`v1/production/${id}`, { json: data }),
    ProductionDetailResponse,
  );

/// Mencatat satu kali antar hasil produksi; responsnya batch terbaru supaya
/// layar detail langsung menampilkan kemajuan barunya.
export const recordProductionDelivery = async (
  id: string,
  data: RecordDeliverySchemaInput,
) =>
  apiFetcher(
    managementApi.post(`v1/production/${id}/deliveries`, { json: data }),
    ProductionDetailResponse,
  );

export const cancelProductionDelivery = async (
  id: string,
  deliveryId: string,
) =>
  apiFetcher(
    managementApi.delete(`v1/production/${id}/deliveries/${deliveryId}`),
    ProductionDetailResponse,
  );

export const closeProduction = async (id: string, createContinuation: boolean) =>
  managementApi
    .patch(`v1/production/${id}/close`, { json: { createContinuation } })
    .json<{ data: { closed: string; continuationCode: string | null } }>();

export const removeProduction = async (id: string) =>
  managementApi.delete(`v1/production/${id}`).json();
