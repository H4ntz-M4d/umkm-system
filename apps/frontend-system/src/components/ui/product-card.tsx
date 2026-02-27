import { useState } from "react";
import { Heart, Eye, ShoppingBag, Star } from "lucide-react";
import { motion } from "framer-motion";
import { Product, formatPrice } from "@/lib/data/products";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-card rounded-2xl overflow-hidden shadow-warm hover:shadow-warm-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isLimited && (
            <span className="px-2.5 py-1 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
              Limited
            </span>
          )}
          {product.isPreOrder && (
            <span className="px-2.5 py-1 bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider rounded-md">
              Pre-Order
            </span>
          )}
          {product.isMadeToOrder && (
            <span className="px-2.5 py-1 bg-foreground/80 text-background text-[10px] font-bold uppercase tracking-wider rounded-md">
              Made to Order
            </span>
          )}
        </div>

        {/* Stock indicator */}
        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-primary/90 text-primary-foreground text-[10px] font-bold rounded-md">
            Sisa {product.stock}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors duration-300 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button className="p-2.5 bg-background/90 rounded-xl text-foreground hover:bg-background transition-colors shadow-warm">
            <Eye size={18} />
          </button>
          <button className="p-2.5 bg-primary rounded-xl text-primary-foreground hover:bg-terracotta-dark transition-colors shadow-warm">
            <ShoppingBag size={18} />
          </button>
          <button
            onClick={() => setLiked(!liked)}
            className="p-2.5 bg-background/90 rounded-xl text-foreground hover:bg-background transition-colors shadow-warm"
          >
            <Heart size={18} fill={liked ? "hsl(var(--primary))" : "none"} stroke={liked ? "hsl(var(--primary))" : "currentColor"} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-center gap-1 mb-1.5">
          <Star size={12} className="fill-primary text-primary" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>
        <h3 className="font-display font-semibold text-sm text-card-foreground mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-primary">{formatPrice(product.price)}</p>
        {product.variants.colors.length > 1 && (
          <div className="flex items-center gap-1 mt-2">
            {product.variants.colors.slice(0, 3).map((color) => (
              <span key={color} className="text-[10px] text-muted-foreground bg-secondary-foreground px-1.5 py-0.5 rounded">
                {color}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
