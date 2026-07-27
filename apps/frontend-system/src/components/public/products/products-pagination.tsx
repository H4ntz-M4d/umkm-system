import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductsPaginationProps {
  page: number;
  totalPages: number;
  /// searchParams halaman saat ini, supaya filter tidak hilang saat pindah halaman.
  params: Record<string, string>;
}

function hrefFor(params: Record<string, string>, page: number) {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));

  const query = next.toString();
  return query ? `/products?${query}` : "/products";
}

/// Server Component — navigasi halaman lewat <Link>, bukan state client.
export default function ProductsPagination({
  page,
  totalPages,
  params,
}: ProductsPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Navigasi halaman produk"
      className="mt-10 flex items-center justify-center gap-1.5"
    >
      <Link
        href={hrefFor(params, page - 1)}
        aria-disabled={page <= 1}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:bg-secondary ${
          page <= 1 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronLeft size={16} />
      </Link>

      {pages.map((item) => (
        <Link
          key={item}
          href={hrefFor(params, item)}
          aria-current={item === page ? "page" : undefined}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm transition-colors ${
            item === page
              ? "border-primary bg-primary/10 font-semibold text-primary"
              : "border-border text-foreground/70 hover:bg-secondary"
          }`}
        >
          {item}
        </Link>
      ))}

      <Link
        href={hrefFor(params, page + 1)}
        aria-disabled={page >= totalPages}
        className={`flex h-9 w-9 items-center justify-center rounded-lg border border-border text-foreground/70 transition-colors hover:bg-secondary ${
          page >= totalPages ? "pointer-events-none opacity-40" : ""
        }`}
      >
        <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
