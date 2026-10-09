import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  fetchPublicBlogCategories,
  fetchPublicBlogs,
} from "@/lib/queries/public/blog.query";
import BlogCard from "@/components/public/blog/blog-card";
import BlogPagination from "@/components/public/blog/blog-pagination";
import { canonical } from "@/lib/seo/site";

const PAGE_SIZE = 9;

/// Sama seperti katalog: tag dan kategori mengarah ke /blog, sedangkan nomor
/// halaman menunjuk ke dirinya sendiri supaya tulisan lama tetap terindeks.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const page = Math.max(1, Number(readParam(params, "page") ?? 1) || 1);
  const path = page > 1 ? `/blog?page=${page}` : "/blog";

  return {
    title: page > 1 ? `Blog — Halaman ${page}` : "Blog",
    description:
      "Cerita, tips merawat rajutan, dan kabar terbaru dari dapur produksi Nurfa Craft.",
    alternates: canonical(path),
  };
}

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(params: SearchParams, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const page = Math.max(1, Number(readParam(params, "page") ?? 1) || 1);
  const category = readParam(params, "category");
  const search = readParam(params, "search");
  const tag = readParam(params, "tag");

  /// Daftar kategori tidak boleh menjatuhkan halaman kalau gagal — tulisannya
  /// yang penting, penyaringnya hanya pelengkap.
  const [blogs, categories] = await Promise.all([
    fetchPublicBlogs({
      skip: (page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
      category,
      search,
      tag,
    }),
    fetchPublicBlogCategories().catch(() => null),
  ]);

  const total = blogs.meta.total ?? blogs.data.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const flatParams = Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(([, value]) => typeof value === "string" && value !== ""),
  ) as Record<string, string>;

  const tagClearedHref = (() => {
    const next = new URLSearchParams(flatParams);
    next.delete("tag");
    next.delete("page");
    const query = next.toString();
    return query ? `/blog?${query}` : "/blog";
  })();

  const categoryHref = (slug?: string) => {
    const next = new URLSearchParams(flatParams);
    next.delete("page");
    if (slug) next.set("category", slug);
    else next.delete("category");

    const query = next.toString();
    return query ? `/blog?${query}` : "/blog";
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          Blog
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cerita dan tips seputar rajutan dari NurfaCraft
        </p>
      </div>

      {/* Form GET biasa: pencarian berjalan tanpa JavaScript, dan kata
          pencariannya ikut tersimpan di URL supaya bisa dibagikan. */}
      <form action="/blog" className="mb-6 flex max-w-md gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            name="search"
            defaultValue={search ?? ""}
            placeholder="Cari tulisan..."
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-primary"
          />
        </div>
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Cari
        </button>
      </form>

      {categories && categories.data.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={categoryHref()}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              !category
                ? "border-primary bg-primary/10 font-medium text-primary"
                : "border-border text-foreground/70 hover:bg-secondary"
            }`}
          >
            Semua
          </Link>
          {categories.data.map((item) => (
            <Link
              key={item.id}
              href={categoryHref(item.slug)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                category === item.slug
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-foreground/70 hover:bg-secondary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Penanda saringan tag: tanpa ini pembaca yang mengeklik tag tidak
          punya cara jelas untuk kembali ke seluruh tulisan. */}
      {tag && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Menampilkan tag</span>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            #{tag}
          </span>
          <Link
            href={tagClearedHref}
            className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Hapus saringan
          </Link>
        </div>
      )}

      {blogs.data.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.data.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="font-display text-lg text-muted-foreground">
            Belum ada tulisan
          </p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {search || category || tag
              ? "Coba ubah kata pencarian, kategori, atau tagnya"
              : "Nantikan cerita pertama dari kami"}
          </p>
        </div>
      )}

      <BlogPagination page={page} totalPages={totalPages} params={flatParams} />
    </main>
  );
}
