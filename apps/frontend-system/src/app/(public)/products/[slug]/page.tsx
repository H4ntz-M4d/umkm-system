import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/public/products/detail.product";
import {
  fetchPublicProductBySlug,
  fetchPublicProducts,
} from "@/lib/queries/public/products.query";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchWishlistIds } from "@/lib/queries/public/wishlist.query";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await fetchPublicProductBySlug(slug);
    return {
      title: `${product.data.name} | NurfaCraft`,
      description: product.data.description,
      openGraph: product.data.image
        ? { images: [{ url: product.data.image }] }
        : undefined,
    };
  } catch {
    return { title: "Produk tidak ditemukan | NurfaCraft" };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Backend melempar 400 untuk slug yang tidak ada; apiFetcher mengubahnya jadi
  // Error biasa, jadi ditangkap di sini dan diarahkan ke halaman 404 Next.
  const product = await fetchPublicProductBySlug(slug).catch(() => null);
  if (!product) notFound();

  const token = await getCustomerToken();

  // Ambil satu lebih banyak dari yang ditampilkan, karena produk ini sendiri
  // ikut terbawa lalu disaring.
  const [related, wishlistIds] = await Promise.all([
    product.data.categoryId
      ? fetchPublicProducts({
          categoryId: product.data.categoryId,
          limit: 5,
        }).catch(() => null)
      : null,
    token ? fetchWishlistIds(token).catch(() => null) : null,
  ]);

  const wishlisted = new Set(wishlistIds?.data ?? []);

  return (
    <ProductDetail
      product={product.data}
      related={
        related?.data.filter((item) => item.id !== product.data.id).slice(0, 4) ??
        []
      }
      inWishlist={wishlisted.has(product.data.id)}
      isLoggedIn={Boolean(token)}
      wishlistedIds={[...wishlisted]}
    />
  );
}
