"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import type { PublicCategoryDataType } from "@repo/schemas";
import { useDebounce } from "@/hooks/use-debounce";
import { ScrollArea } from "@/components/ui/scroll-area";

const TYPE_OPTIONS = [
  { value: "READY_STOCK", label: "Ready Stock" },
  { value: "PRE_ORDER", label: "Pre-Order" },
  { value: "MADE_TO_ORDER", label: "Made to Order" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Terbaru" },
  { value: "price_asc", label: "Harga Terendah" },
  { value: "price_desc", label: "Harga Tertinggi" },
];

interface ProductsFilterProps {
  categories: PublicCategoryDataType[];
}

/**
 * Sidebar filter katalog. Halaman produknya SSR, jadi komponen ini tidak
 * menyimpan hasil apa pun — ia hanya menulis ulang searchParams dan membiarkan
 * server merender ulang daftar produknya.
 */
export default function ProductsFilter({ categories }: ProductsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const activeSearch = searchParams.get("search") ?? "";
  const activeCategoryId = searchParams.get("categoryId") ?? "";
  const activeType = searchParams.get("type") ?? "";
  const activeSort = searchParams.get("sort") ?? "newest";

  const [search, setSearch] = useState(activeSearch);
  const debouncedSearch = useDebounce(search, 500);

  const applyParams = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }

    // Filter berubah berarti jumlah halaman ikut berubah; kembali ke halaman 1
    // supaya user tidak mendarat di halaman kosong.
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  // Input pencarian dikendalikan lokal supaya tidak lag, lalu disinkronkan ke
  // URL setelah user berhenti mengetik.
  useEffect(() => {
    if (debouncedSearch === activeSearch) return;
    applyParams({ search: debouncedSearch });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  return (
    <>
      {/* Mobile filter toggle */}
      <button
        type="button"
        onClick={() => setShowFilters((prev) => !prev)}
        className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors w-fit"
      >
        <SlidersHorizontal size={16} /> Filter
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          initial={false}
          animate={{ opacity: 1 }}
          className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-56 shrink-0`}
        >
          {/* Search */}
          <div className="relative mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Kategori — tinggi tetap, sisanya discroll lewat ScrollArea */}
          <div className="mb-6">
            <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Kategori
            </h3>
            <ScrollArea className="h-48 pr-3">
              <div className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => applyParams({ categoryId: null })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !activeCategoryId
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70 hover:bg-secondary hover:text-white"
                  }`}
                >
                  Semua Kategori
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => applyParams({ categoryId: category.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeCategoryId === category.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-foreground/70 hover:bg-secondary hover:text-white"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Tipe — backend hanya menerima satu nilai type, jadi dibuat pilihan
              tunggal seperti Kategori, bukan checkbox. */}
          <div className="border-t border-border pt-4 mb-6">
            <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Tipe
            </h3>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => applyParams({ type: null })}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  !activeType
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70 hover:bg-secondary hover:text-white"
                }`}
              >
                Semua Tipe
              </button>
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyParams({ type: option.value })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeType === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70 hover:bg-secondary hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Urutkan */}
          <div className="border-t border-border pt-4">
            <h3 className="text-xs font-display font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Urutkan
            </h3>
            <div className="space-y-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => applyParams({ sort: option.value })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeSort === option.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground/70 hover:bg-secondary hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </motion.aside>
      </AnimatePresence>
    </>
  );
}
