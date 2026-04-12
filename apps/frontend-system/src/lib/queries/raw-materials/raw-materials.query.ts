import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CreateMaterialsSchemaInput,
  MaterialsDataResponse,
  RawMaterialListResponse,
  SingleMaterialsDataResponse,
  UpdateMaterialsSchemaInput,
} from "@repo/schemas";

export const fetchAllMaterials = async (
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(
      `api/v1/materials?skip=${skip}&limit=${pageSize}&search=${search}`,
    ),
    MaterialsDataResponse,
  );
  return { data: res.data, total: res.meta.total };
};

export const fetchRawMaterialList = async () => {
  const res = await apiFetcher(
    managementApi.get("api/v1/materials/list"),
    RawMaterialListResponse
  );
  return res;
}

export const fetchMaterialsById = async (id: string) => {
  const res = await apiFetcher(
    managementApi.get(`api/v1/materials/${id}`),
    SingleMaterialsDataResponse,
  );
  return res
};

export const createRawMaterial = async (data: CreateMaterialsSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("api/v1/materials", { json: data }),
    SingleMaterialsDataResponse,
  );

  return res;
};

export const updateRawMaterial = async (
  id: string,
  data: UpdateMaterialsSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.patch(`api/v1/materials/${id}`, { json: data }),
    SingleMaterialsDataResponse,
  );

  return res;
};

export const deleteRawMaterial = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`api/v1/materials/${id}`),
    SingleMaterialsDataResponse,
  );
  return res;
};
