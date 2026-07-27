import Link from "next/link";
import { X } from "lucide-react";
import type { PublicCategoryDataType } from "@repo/schemas";

const TYPE_LABELS: Record<string, string> = {
  READY_STOCK: "Ready Stock",
  PRE_ORDER: "Pre-Order",
  MADE_TO_ORDER: "Made to Order",
};

interface ProductsActiveFiltersProps {
  params: Record<string, string>;
  categories: PublicCategoryDataType[];
}

function hrefWithout(params: Record<string, string>, key: string) {
  const next = new URLSearchParams(params);
  next.delete(key);
  next.delete("page");
  const query = next.toString();
  return query ? `/products?${query}` : "/products";
}

/// Server Component — menghapus filter cukup lewat navigasi Link, tidak perlu
/// state client sama sekali.
export default function ProductsActiveFilters({
  params,
  categories,
}: ProductsActiveFiltersProps) {
  const chips: { key: string; label: string }[] = [];

  if (params.search) chips.push({ key: "search", label: `"${params.search}"` });
  if (params.categoryId) {
    const category = categories.find((item) => item.id === params.categoryId);
    chips.push({ key: "categoryId", label: category?.name ?? "Kategori" });
  }
  if (params.type) {
    chips.push({ key: "type", label: TYPE_LABELS[params.type] ?? params.type });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <Link
          key={chip.key}
          href={hrefWithout(params, chip.key)}
          scroll={false}
          className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
        >
          {chip.label}
          <X size={12} />
        </Link>
      ))}
    </div>
  );
}
