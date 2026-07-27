import { customerApi } from "@/lib/api/api.customer";
import { apiFetcher } from "@/lib/api/api.fetcher";
import {
  PublicCategoriesResponse,
  PublicProductDetailResponse,
  PublicProductsResponse,
  type PublicProductQueryInput,
} from "@repo/schemas";

/// Dipanggil dari Server Component. api.customer sudah otomatis memakai
/// SERVER_API_URL saat berjalan di server, jadi service yang sama dipakai
/// kedua sisi tanpa cabang.
export const fetchPublicProducts = async (
  params: PublicProductQueryInput = {},
) => {
  const searchParams = Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  ) as Record<string, string | number>;

  return apiFetcher(
    customerApi.get("v1/public/products", { searchParams }),
    PublicProductsResponse,
  );
};

export const fetchPublicProductBySlug = async (slug: string) =>
  apiFetcher(
    customerApi.get(`v1/public/products/${slug}`),
    PublicProductDetailResponse,
  );

export const fetchPublicCategories = async () =>
  apiFetcher(customerApi.get("v1/public/categories"), PublicCategoriesResponse);
