import type { Metadata } from "next";
import type { PublicProductQueryInput } from "@repo/schemas";
import {
  fetchPublicCategories,
  fetchPublicProducts,
} from "@/lib/queries/public/products.query";
import ProductCard from "@/components/public/products/products-card";
import ProductsFilter from "@/components/public/products/products-filter";
import ProductsActiveFilters from "@/components/public/products/products-active-filters";
import ProductsPagination from "@/components/public/products/products-pagination";

const PAGE_SIZE = 12;

export const metadata: Metadata = {
  title: "Koleksi Rajutan | NurfaCraft",
  description:
    "Jelajahi koleksi rajutan handmade NurfaCraft — dikerjakan tangan oleh pengrajin lokal Indonesia.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(readParam(params, "page") ?? 1) || 1);
  const query: PublicProductQueryInput = {
    skip: (page - 1) * PAGE_SIZE,
    limit: PAGE_SIZE,
    search: readParam(params, "search"),
    categoryId: readParam(params, "categoryId"),
    type: readParam(params, "type") as PublicProductQueryInput["type"],
    sort: readParam(params, "sort") as PublicProductQueryInput["sort"],
  };

  const [products, categories] = await Promise.all([
    fetchPublicProducts(query),
    fetchPublicCategories(),
  ]);

  const total = products.meta.total ?? products.data.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // searchParams versi datar untuk dirakit ulang jadi href oleh chip filter &
  // paginasi.
  const flatParams = Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(([, value]) => typeof value === "string" && value !== ""),
  ) as Record<string, string>;

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Koleksi Kami
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Temukan rajutan handmade sempurna untukmu
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <ProductsFilter categories={categories.data} />

        <div className="flex-1">
          <ProductsActiveFilters params={flatParams} categories={categories.data} />

          <p className="text-xs text-muted-foreground mb-6">
            {total} produk ditemukan
          </p>

          {products.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.data.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-display text-lg text-muted-foreground">
                Tidak ada produk ditemukan
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Coba ubah filter pencarian
              </p>
            </div>
          )}

          <ProductsPagination
            page={page}
            totalPages={totalPages}
            params={flatParams}
          />
        </div>
      </div>
    </main>
  );
}
