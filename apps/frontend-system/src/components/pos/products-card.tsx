"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";
import { toIDR } from "../../../utils/format-money";
import NoImage from "@/assets/no-picture.jpg";
import type { ProductList } from "@/components/pos/pos-view";

interface ProductCardProps {
  product: ProductList;
  index?: number;
  handleProductClick: (product: ProductList) => void;
  setIdPm: (idPm: string) => void;
}

const ProductCard = ({
  product,
  index = 0,
  handleProductClick,
  setIdPm,
}: ProductCardProps) => {
  // Produk yang belum punya foto sama sekali tetap harus tampil, bukan crash.
  const image = product.variants.find((v) => v.image)?.image ?? NoImage;
  const totalVariant = product.variants.length;
  const totalStock = product.variants.reduce((a, v) => a + v.stock, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer hover:border-primary border hover:shadow-xl relative bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300"
      onClick={() => {
        handleProductClick(product);
        setIdPm(product.id);
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <Image
          width={100}
          height={100}
          src={image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {totalVariant > 1 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary/70 text-primary-foreground text-[10px] font-bold rounded-md">
            {totalVariant} Varian
          </span>
        )}

        {/* Purchased indicator */}
        {/* {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-md">
            Sisa {product.stock}
          </span>
        )} */}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1">
            <Star size={12} className="fill-primary text-primary" />
            <span className="text-xs font-medium text-foreground">
              4.5{/* {product.rating} */}
            </span>
          </div>

          <span className="text-xs text-muted-foreground">
            {totalStock} pcs
          </span>
        </div>
        <h3 className="font-display font-semibold text-sm text-card-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-primary">
          {totalVariant > 1 ? (
            <>Mulai dari {toIDR(product.variants[0]!.price)} </>
          ) : (
            <>{toIDR(product.variants[0]!.price)}</>
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
