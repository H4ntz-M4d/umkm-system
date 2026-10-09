import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { fetchPublicBlogs } from "@/lib/queries/public/blog.query";
import BlogCard from "../blog/blog-card";

/**
 * Tiga tulisan terbaru di beranda.
 *
 * Server Component seperti koleksi pilihan, supaya isinya ikut ter-render di
 * HTML awal dan terbaca mesin pencari. Kalau belum ada tulisan terbit — atau
 * pengambilannya gagal — bagian ini tidak ditampilkan sama sekali, bukan
 * menyisakan judul dengan ruang kosong di bawahnya.
 */
export default async function LatestBlogs() {
  const blogs = await fetchPublicBlogs({ limit: 3 }).catch(() => null);

  if (!blogs || blogs.data.length === 0) return null;

  return (
    <section className="bg-sidebar py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="mb-12 text-center">
          <span className="text-xs font-medium uppercase tracking-widest text-secondary">
            Dari Blog
          </span>
          <h2 className="font-display mt-2 text-3xl font-bold text-foreground md:text-4xl">
            Cerita & Tips Rajut
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Catatan dari dapur produksi kami: cara merawat rajutan, bahan yang
            kami pakai, dan proses di balik tiap produk.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogs.data.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Lihat Semua Tulisan
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
