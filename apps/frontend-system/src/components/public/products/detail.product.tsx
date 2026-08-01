"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Truck, ShieldCheck, Package } from "lucide-react";
import {
  signatureForOptions,
  type PublicProductCardDataType,
  type PublicProductDetailDataType,
} from "@repo/schemas";
import { toIDR } from "../../../../utils/format-money";
import ProductCard from "./products-card";
import { isOutOfStock, productTypeBadge } from "./product-display";
import WishlistButton from "../wishlist/wishlist-button";
import AddToCartButton from "../cart/add-to-cart-button";
import type { GuestCartItem } from "@/stores/cart.store";
import { Toaster } from "@/components/ui/sonner";

interface ProductDetailProps {
  product: PublicProductDetailDataType;
  related: PublicProductCardDataType[];
  inWishlist?: boolean;
  isLoggedIn?: boolean;
  /// Id produk yang ada di wishlist, dipakai kartu "Kamu Mungkin Suka".
  wishlistedIds?: string[];
}

/// Pilihan awal: variant pertama yang masih ada stoknya, kalau semua habis pakai
/// variant pertama supaya selector tetap terisi.
function initialOptions(product: PublicProductDetailDataType) {
  const preferred =
    product.variants.find((variant) => variant.stock > 0) ?? product.variants[0];
  return preferred?.options ?? {};
}

const ProductDetail = ({
  product,
  related,
  inWishlist = false,
  isLoggedIn = false,
  wishlistedIds = [],
}: ProductDetailProps) => {
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    initialOptions(product),
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const wishlisted = new Set(wishlistedIds);

  const visualTypeNames = useMemo(
    () =>
      new Set(
        product.variantTypes
          .filter((type) => type.isHaveVisual)
          .map((type) => type.name),
      ),
    [product.variantTypes],
  );

  const selectedVariant = useMemo(
    () =>
      product.variants.find((variant) =>
        Object.entries(selected).every(
          ([type, value]) => variant.options[type] === value,
        ),
      ),
    [product.variants, selected],
  );

  // Galeri mengikuti nilai variant yang visual saja. signatureForOptions dipakai
  // bersama backend supaya hasilnya identik dengan signature yang tersimpan.
  const images = useMemo(() => {
    const signature = signatureForOptions(selected, visualTypeNames);
    const group =
      product.imageGroups.find((item) => item.signature === signature) ??
      product.imageGroups.find(
        (item) => item.id === selectedVariant?.imageGroupId,
      ) ??
      product.imageGroups[0];

    return group?.images ?? [];
  }, [product.imageGroups, selected, selectedVariant, visualTypeNames]);

  const badge = productTypeBadge(product.type);
  const stock = selectedVariant?.stock ?? 0;
  const outOfStock = isOutOfStock(product.type, stock);
  const price = selectedVariant?.price ?? product.priceMin;
  const maxQuantity = product.type === "READY_STOCK" ? Math.max(stock, 1) : 99;

  const chooseOption = (typeName: string, value: string) => {
    setSelected((current) => ({ ...current, [typeName]: value }));
    setActiveImage(0);
    setQuantity(1);
  };

  // Snapshot dipakai keranjang guest untuk merender item tanpa memanggil API.
  // Harga finalnya tetap dihitung ulang server saat checkout.
  const cartItem: GuestCartItem | null = selectedVariant
    ? {
        productVariantId: selectedVariant.id,
        quantity,
        snapshot: {
          productMasterId: product.id,
          slug: product.slug,
          productName: product.name,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          image: images[0]?.image ?? product.image,
          options: selectedVariant.options,
          stock: selectedVariant.stock,
        },
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Galeri */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="relative aspect-3/4 bg-card rounded-2xl overflow-hidden shadow-warm">
              {images[activeImage] ? (
                <Image
                  src={images[activeImage].image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Belum ada gambar
                </div>
              )}

              {badge && (
                <span className="absolute top-4 left-4 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
                  {badge}
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                      index === activeImage
                        ? "border-primary"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <Image
                      src={image.image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            {product.categoryName && (
              <span className="text-xs font-medium uppercase tracking-widest text-secondary">
                {product.categoryName}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-3">
              {selectedVariant && (
                <span className="text-xs text-muted-foreground">
                  SKU {selectedVariant.sku}
                </span>
              )}
              <span className="text-sm text-muted-foreground">·</span>
              <span
                className={`text-sm font-medium ${
                  outOfStock ? "text-destructive" : "text-foreground/70"
                }`}
              >
                {outOfStock
                  ? "Stok habis"
                  : product.type === "READY_STOCK"
                    ? stock > 5
                      ? "Tersedia"
                      : `Sisa ${stock}`
                    : "Dibuat setelah dipesan"}
              </span>
            </div>

            <p className="text-3xl font-bold text-primary mt-5">
              {toIDR(price)}
            </p>

            <p className="text-sm text-muted-foreground mt-5 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>

            {/* Selector varian */}
            {product.useVariant &&
              product.variantTypes.map((variantType) => (
                <div key={variantType.id} className="mt-6">
                  <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    {variantType.name}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {variantType.values.map((value) => {
                      const isActive = selected[variantType.name] === value.value;
                      return (
                        <button
                          key={value.id}
                          type="button"
                          onClick={() =>
                            chooseOption(variantType.name, value.value)
                          }
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            isActive
                              ? "border-primary bg-primary/10 text-primary font-medium"
                              : "border-border text-foreground/70 hover:bg-secondary"
                          }`}
                        >
                          {value.value}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Jumlah */}
            <div className="mt-5">
              <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Jumlah
              </h3>
              <div className="inline-flex items-center border border-border rounded-xl">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 text-foreground/70 hover:text-foreground disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-medium min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(maxQuantity, quantity + 1))
                  }
                  className="p-2.5 text-foreground/70 hover:text-foreground disabled:opacity-40"
                  disabled={quantity >= maxQuantity}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Aksi */}
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <AddToCartButton
                item={cartItem}
                isLoggedIn={isLoggedIn}
                disabled={outOfStock || !selectedVariant}
                disabledLabel={
                  outOfStock ? "Stok Habis" : "Varian Tidak Tersedia"
                }
              />
              <WishlistButton
                productMasterId={product.id}
                initialInWishlist={inWishlist}
                isLoggedIn={isLoggedIn}
                variant="full"
              />
            </div>

            {/* Perks */}
            <div className="grid grid-cols-3 gap-3 mt-8 pt-6 border-t border-border">
              {[
                { icon: Truck, label: "Gratis ongkir" },
                { icon: ShieldCheck, label: "Garansi mutu" },
                { icon: Package, label: "Kemasan rapi" },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center gap-1.5"
                >
                  <Icon size={20} className="text-primary" />
                  <span className="text-[11px] text-muted-foreground">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Terkait */}
        {related.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              Kamu Mungkin Suka
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={index}
                  inWishlist={wishlisted.has(item.id)}
                  isLoggedIn={isLoggedIn}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Toaster />
    </div>
  );
};

export default ProductDetail;
