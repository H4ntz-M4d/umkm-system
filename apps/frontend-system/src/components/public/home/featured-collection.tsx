import ProductCard from "@/components/ui/product-card";
import { products } from "@/lib/data/products";
import { motion } from "framer-motion";

export default function FeaturedCollection() {
  const featured = products.slice(0, 4);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
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
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
