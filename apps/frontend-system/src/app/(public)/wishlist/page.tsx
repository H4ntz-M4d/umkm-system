import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchWishlist } from "@/lib/queries/public/wishlist.query";
import ProductCard from "@/components/public/products/products-card";

export const metadata: Metadata = {
  title: "Wishlist | NurfaCraft",
};

export default async function Page() {
  // proxy.ts sudah menjaga rute ini, jadi kalau sampai token kosong itu kondisi
  // tepi (cookie kedaluwarsa di tengah jalan) — tampilkan wishlist kosong saja.
  const token = await getCustomerToken();
  const wishlist = token ? await fetchWishlist(token).catch(() => null) : null;
  const items = wishlist?.data ?? [];

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Wishlist
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          {items.length > 0
            ? `${items.length} rajutan yang kamu simpan`
            : "Rajutan yang kamu simpan akan muncul di sini"}
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <ProductCard
              key={item.wishlistId}
              product={item}
              index={index}
              inWishlist
              isLoggedIn
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Heart size={40} className="mx-auto text-muted-foreground/40" />
          <p className="font-display text-lg text-muted-foreground mt-4">
            Wishlist kamu masih kosong
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Tekan ikon hati pada produk untuk menyimpannya
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-terracotta-dark transition-colors"
          >
            Jelajahi Koleksi
          </Link>
        </div>
      )}
    </main>
  );
}
