import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateProductionSchemaInput,
  ProductionDataResponse,
  ProductionResponse,
  ProductionSummaryResponse,
  UpdateProductionSchemaInput,
} from "@repo/schemas";

export interface ProductionFilters {
  skip?: number;
  limit?: number;
  search?: string;
  type?: string;
  status?: string;
}

export const fetchProductionData = async (filter: ProductionFilters) => {
  const filters = Object.fromEntries(
    Object.entries(filter).filter(([_, v]) => v !== undefined && v !== ""),
  );

  const queryFilter = new URLSearchParams(filters).toString();
  const res = await apiFetcher(
    managementApi.get(`v1/production?${queryFilter}`),
    ProductionResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const fetchProductionSummary = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/production/summary"),
    ProductionSummaryResponse,
  );

  return res;
};

export const createProduction = async (data: CreateProductionSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("v1/production", { json: data }),
    ProductionDataResponse,
  );

  return res;
};

export const updateProduction = async (
  id: string,
  data: CreateProductionSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.put(`v1/production/${id}/edit`, { json: data }),
    ProductionDataResponse,
  );
  return res;
};

export const updateProductionStatus = async (
  id: string,
  data: UpdateProductionSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.patch(`v1/production/${id}/status-update`, { json: data }),
    ProductionDataResponse,
  );
  return res;
};

export const updateProductionStatusCompleted = async (
  id: string,
  data: UpdateProductionSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.post(`v1/production/${id}/status-completed`, { json: data }),
    ProductionDataResponse,
  );
  return res;
};

export const deleteProduction = async (id: string) => {
  return await apiFetcher(
    managementApi.delete(`v1/production/${id}`),
    ProductionDataResponse,
  );
};
