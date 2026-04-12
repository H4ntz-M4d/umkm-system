import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateProductionSchemaInput,
  ProductionDataResponse,
  ProductionResponse,
  UpdateProductionSchemaInput,
} from "@repo/schemas";

export const fetchProductionData = async (
  pageIndex = 0,
  pageSize = 0,
  search?: string,
) => {
  const res = await apiFetcher(
    managementApi.get(
      `api/v1/production?page=${pageIndex}&pageSize=${pageSize}&search=${search}`,
    ),
    ProductionResponse,
  );

  return { data: res.data, total: res.meta.total };
};

export const createProduction = async (data: CreateProductionSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("api/v1/production", { json: data }),
    ProductionDataResponse,
  );

  return res;
};

export const updateProduction = async (
  id: string,
  data: UpdateProductionSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.patch(`api/v1/production/${id}/edit`, { json: data }),
    ProductionDataResponse,
  );
  return res;
};

export const deleteProduction = async (id: string) => {
  return await apiFetcher(
    managementApi.delete(`api/v1/production/${id}`),
    ProductionDataResponse,
  );
};
