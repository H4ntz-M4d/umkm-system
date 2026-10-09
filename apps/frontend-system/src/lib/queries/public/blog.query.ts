import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  BlogCategoryListResponse,
  BlogDetailResponse,
  BlogListResponse,
  type PublicBlogQueryInput,
} from "@repo/schemas";

/// Dipanggil dari Server Component, sama seperti katalog produk: hanya
/// tulisan yang sudah terbit yang dibalas server.
export const fetchPublicBlogs = async (params: PublicBlogQueryInput = {}) => {
  const searchParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Record<string, string | number>;

  return apiFetcher(
    customerApi.get("v1/public/blog", { searchParams }),
    BlogListResponse,
  );
};

export const fetchPublicBlogBySlug = async (slug: string) =>
  apiFetcher(customerApi.get(`v1/public/blog/${slug}`), BlogDetailResponse);

export const fetchPublicBlogCategories = async () =>
  apiFetcher(
    customerApi.get("v1/public/blog/categories"),
    BlogCategoryListResponse,
  );
