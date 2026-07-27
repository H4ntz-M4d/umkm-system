"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { PublicProductCardDataType } from "@repo/schemas";
import { toIDR } from "../../../../utils/format-money";
import { isOutOfStock, productTypeBadge } from "./product-display";

interface ProductCardProps {
  product: PublicProductCardDataType;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const badge = productTypeBadge(product.type);
  const outOfStock = isOutOfStock(product.type, product.totalStock);
  const priceLabel =
    product.priceMin === product.priceMax
      ? toIDR(product.priceMin)
      : `${toIDR(product.priceMin)} - ${toIDR(product.priceMax)}`;

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
          {outOfStock ? (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-foreground/80 text-background text-[10px] font-bold uppercase tracking-wider rounded-md">
              Stok Habis
            </span>
          ) : (
            product.totalStock <= 5 && (
              <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-md">
                Sisa {product.totalStock}
              </span>
            )
          )}
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
