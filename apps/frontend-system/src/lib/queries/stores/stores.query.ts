import managementApi from "../../api/api.management";
import {
  StoreListResponse,
  StoreInput,
  StoreSingleResponse,
  StoreAllDataResponse,
} from "@repo/schemas";
import { apiFetcher } from "@/lib/api/api.fetcher";

export const fetchStore = async (pageIndex = 0, pageSize = 10) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(`api/v1/stores?skip=${skip}&limit=${pageSize}`),
    StoreAllDataResponse,
  );
  return { data: res.data, total: res.meta.total };
};

export const fetchStoreList = async () => {
  const res = await apiFetcher(
    managementApi.get(`api/v1/stores/list`),
    StoreListResponse,
  );
  return { data: res.data };
};

export const createStore = async (payload: StoreInput) => {
  const res = await apiFetcher(
    managementApi.post("api/v1/stores", { json: payload }),
    StoreSingleResponse,
  );
  return res.data;
};

export const updateStore = async (id: string, payload: any) => {
  const res = await apiFetcher(
    managementApi.patch(`api/v1/stores/${id}`, { json: payload }),
    StoreSingleResponse,
  );
  return res.data;
};

export const removeStore = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`api/v1/stores/${id}`),
    StoreSingleResponse,
  );
  return res.data;
};
