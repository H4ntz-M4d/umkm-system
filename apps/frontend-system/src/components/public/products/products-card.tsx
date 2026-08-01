"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PublicProductCardDataType } from "@repo/schemas";
import { toIDR } from "../../../../utils/format-money";
import { isOutOfStock, productTypeBadge } from "./product-display";
import WishlistButton from "../wishlist/wishlist-button";

interface ProductCardProps {
  product: PublicProductCardDataType;
  index?: number;
  inWishlist?: boolean;
  isLoggedIn?: boolean;
}

const ProductCard = ({
  product,
  index = 0,
  inWishlist = false,
  isLoggedIn = false,
}: ProductCardProps) => {
  const badge = productTypeBadge(product.type);
  const outOfStock = isOutOfStock(product.type, product.totalStock);
  const priceLabel =
    product.priceMin === product.priceMax
      ? toIDR(product.priceMin)
      : `${toIDR(product.priceMin)} - ${toIDR(product.priceMax)}`;

  const renderStockBadge = () => {
    // 1. Tipe READY_STOCK (Mengandalkan Stok Fisik)
    if (product.type === "READY_STOCK") {
      if (product.totalStock <= 0) {
        return (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-foreground/80 text-background text-[10px] font-bold uppercase tracking-wider rounded-md">
            Stok Habis
          </span>
        );
      }

      if (product.totalStock <= 5) {
        return (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-bold rounded-md">
            Sisa {product.totalStock}
          </span>
        );
      }

      return null; // Tidak tampilkan badge jika stok masih aman (> 5)
    }

    // 2. Tipe PRE_ORDER (Menampilkan Kuota Maksimal)
    if (product.type === "PRE_ORDER") {
      const maxQuota =
        product.productPreOrderDetail?.maxQuota;

      return (
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold rounded-md">
          PO (Sisa: {maxQuota ?? 0} Pcs)
        </span>
      );
    }

    // 3. Tipe MADE_TO_ORDER (Selalu Tersedia)
    if (product.type === "MADE_TO_ORDER") {
      return (
        <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600/90 text-white text-[10px] font-bold rounded-md">
          Tersedia
        </span>
      );
    }

    return null;
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300"
    >
      <Link href={`/products/${product.slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-105 transition-transform duration-500 ${
                outOfStock ? "opacity-60" : ""
              }`}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              Tanpa gambar
            </div>
          )}

          {badge && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
              {badge}
            </span>
          )}

          {/* Produk habis tetap tampil — hanya ditandai, tidak disembunyikan. */}
          {renderStockBadge()}

          <WishlistButton
            productMasterId={product.id}
            initialInWishlist={inWishlist}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* Info */}
        <div className="p-4">
          {product.categoryName && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-secondary">
              {product.categoryName}
            </span>
          )}
          <h3 className="font-display font-semibold text-sm text-card-foreground mt-1 mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm font-semibold text-primary">{priceLabel}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
