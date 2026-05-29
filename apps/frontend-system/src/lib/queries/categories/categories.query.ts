import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  CategoriesResponse,
  CategoriesSchemaInput,
  CategoriesSummaryResponse,
  CategoryListResponse,
  CategoryResponse,
} from "@repo/schemas";

export const fetchCategories = async (search: string) => {
  const res = await apiFetcher(
    managementApi.get(`v1/categories?search=${search}`),
    CategoriesResponse,
  );

  return { data: res.data };
};

export const fetchCategoryList = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/categories/list"),
    CategoryListResponse,
  );

  return res;
};

export const fetchCategoriesSummary = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/categories/summary"),
    CategoriesSummaryResponse,
  );

  return res;
};

export const createCategories = async (data: CategoriesSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("v1/categories", { json: data }),
    CategoryResponse,
  );

  return res;
};

export const updateCategories = async (
  id: string,
  data: CategoriesSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.put(`v1/categories/${id}`, { json: data }),
    CategoryResponse,
  );

  return res;
};

export const deleteCategories = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`v1/categories/${id}`),
    CategoryResponse,
  );

  return res;
};
