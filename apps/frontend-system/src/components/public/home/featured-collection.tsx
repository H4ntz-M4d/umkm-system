import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchPublicProducts } from "@/lib/queries/public/products.query";
import { fetchWishlistIds } from "@/lib/queries/public/wishlist.query";
import { getCustomerToken } from "@/lib/api/server-token";
import ProductCard from "../products/products-card";

/// Server Component — koleksi pilihan ikut ter-render di HTML awal.
export default async function FeaturedCollection() {
  const token = await getCustomerToken();
  const [featured, wishlistIds] = await Promise.all([
    fetchPublicProducts({ limit: 4, sort: "newest" }).catch(() => null),
    token ? fetchWishlistIds(token).catch(() => null) : null,
  ]);

  if (!featured || featured.data.length === 0) return null;

  const wishlisted = new Set(wishlistIds?.data ?? []);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-medium uppercase tracking-widest text-secondary">
            Koleksi Pilihan
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
            Rajutan Terbaik Kami
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
            Setiap produk dikerjakan tangan dengan penuh ketelitian oleh
            pengrajin lokal Indonesia.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.data.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              index={index}
              inWishlist={wishlisted.has(product.id)}
              isLoggedIn={Boolean(token)}
            />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            Lihat Semua Koleksi
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
