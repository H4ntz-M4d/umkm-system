import { apiFetcher } from "@/lib/api/api.fetcher";
import managementApi from "@/lib/api/api.management";
import {
  BlogCategoryListResponse,
  BlogCategoryResponse,
  BlogCategorySchemaInput,
  BlogCoverResponse,
  BlogDetailResponse,
  BlogListResponse,
  BlogSchemaInput,
  BlogStatusInput,
} from "@repo/schemas";

export interface BlogFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: BlogStatusInput | "";
  categoryId?: string;
}

export const fetchBlogs = async (filters: BlogFilters) => {
  const { page, ...rest } = filters;
  const limit = rest.limit ?? 10;

  /// Sama seperti modul lain: halaman diterjemahkan jadi `skip` karena backend
  /// hanya membaca `skip`/`limit`.
  const params = Object.fromEntries(
    Object.entries({ ...rest, limit, skip: (page ?? 0) * limit })
      .filter(([, value]) => value !== undefined && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );

  const res = await apiFetcher(
    managementApi.get(`v1/blog?${new URLSearchParams(params).toString()}`),
    BlogListResponse,
  );

  return { data: res.data, total: res.meta.total ?? 0 };
};

export const fetchBlogDetail = async (id: string) => {
  const res = await apiFetcher(
    managementApi.get(`v1/blog/${id}`),
    BlogDetailResponse,
  );

  return res.data;
};

export const createBlog = async (data: BlogSchemaInput) =>
  apiFetcher(managementApi.post("v1/blog", { json: data }), BlogDetailResponse);

export const updateBlog = async (id: string, data: BlogSchemaInput) =>
  apiFetcher(
    managementApi.put(`v1/blog/${id}`, { json: data }),
    BlogDetailResponse,
  );

export const deleteBlog = async (id: string) =>
  managementApi.delete(`v1/blog/${id}`).json();

/// Gambar diunggah lebih dulu dan yang disimpan di tulisan hanya URL-nya,
/// supaya penyimpanan tulisan tidak ikut menunggu unggahan.
export const uploadBlogCover = async (file: File) => {
  const body = new FormData();
  body.append("image", file);

  const res = await apiFetcher(
    managementApi.post("v1/blog/cover", { body }),
    BlogCoverResponse,
  );

  return res.data.image;
};

export const fetchBlogCategories = async () => {
  const res = await apiFetcher(
    managementApi.get("v1/blog/categories"),
    BlogCategoryListResponse,
  );

  return res.data;
};

export const createBlogCategory = async (data: BlogCategorySchemaInput) =>
  apiFetcher(
    managementApi.post("v1/blog/categories", { json: data }),
    BlogCategoryResponse,
  );

export const deleteBlogCategory = async (id: string) =>
  managementApi.delete(`v1/blog/categories/${id}`).json();
