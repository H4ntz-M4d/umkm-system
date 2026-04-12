import managementApi from "../../api/api.management";
import { ProductMaster } from "@/common/types";
import {
  CreateProductSchemaInput,
  AllProductResponse,
  ProductResponseById,
  ProductsResponse,
  ProductVariantResponse,
} from "@repo/schemas";
import { apiFetcher } from "@/lib/api/api.fetcher";

export const fetchProduct = async (
  pageIndex = 0,
  pageSize = 10,
  search?: string,
) => {
  const skip = pageIndex * pageSize;
  const res = await apiFetcher(
    managementApi.get(
      `api/v1/products?skip=${skip}&limit=${pageSize}&search=${search}`,
    ),
    AllProductResponse,
  );
  return res;
};

export const fetchProductVariantList = async () => {
  const res = await apiFetcher(
    managementApi.get('api/v1/products/list'),
    ProductVariantResponse
  )

  return res;
}

export const fetchProductById = async (id: string) => {
  const res = await apiFetcher(
    managementApi.get(`api/v1/products/${id}/details`),
    ProductResponseById,
  );
  return res;
};

export const createProduct = async (data: CreateProductSchemaInput) => {
  const res = await apiFetcher(
    managementApi.post("api/v1/products", { json: data }),
    ProductsResponse,
  );
  return res;
};

export const updateProduct = async (
  id: string,
  data: CreateProductSchemaInput,
) => {
  const res = await apiFetcher(
    managementApi.put(`api/v1/products/${id}`, { json: data }),
    ProductsResponse,
  );
  return res;
};

export const uploadImage = async ({
  productId,
  variantIds,
  files,
}: {
  productId: string;
  variantIds: string[];
  files: File[];
}) => {
  const data = new FormData();
  data.append("variantIds", JSON.stringify(variantIds));
  files.forEach((file) => data.append("images", file));
  const res = await managementApi
    .patch(`api/v1/products/${productId}/upload`, { body: data })
    .json<any>();
  return res;
};

export const deleteProduct = async (id: string) => {
  const res = await apiFetcher(
    managementApi.delete(`api/v1/products/${id}`),
    ProductsResponse,
  );
  return res;
};
