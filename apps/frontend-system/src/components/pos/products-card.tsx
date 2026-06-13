"use client";

import { useState } from "react";
import { Heart, Eye, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product, formatPrice } from "@/lib/queries/data/products";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { toIDR } from "../../../utils/format-money";
import { ProductList } from "@/app/point-of-sale/system/page";

interface ProductCardProps {
  product: any;
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
  const [liked, setLiked] = useState(false);
  const image = product?.variants.find((v) => v.image !== null);
  const totalVariant = product?.variants.length;
  const totalStock = product?.variants
    ?.map((v) => v.stock)
    .reduce((a, b) => a + b, 0);

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
          src={image.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {product?.variants?.length > 1 && (
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
          {product.variants.length > 1 ? (
            <>Mulai dari {toIDR(product.variants[0].price)} </>
          ) : (
            <>{toIDR(product.variants[0].price)}</>
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
