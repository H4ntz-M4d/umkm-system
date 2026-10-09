import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { dayjs } from "@repo/utils";
import {
  fetchPublicBlogBySlug,
  fetchPublicBlogs,
} from "@/lib/queries/public/blog.query";
import BlogCard from "@/components/public/blog/blog-card";
import { absoluteUrl, canonical } from "@/lib/seo/site";
import { JsonLd, articleSchema, breadcrumbSchema } from "@/lib/seo/json-ld";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const blog = await fetchPublicBlogBySlug(slug);
    return {
      title: blog.data.title,
      description: blog.data.excerpt ?? undefined,
      keywords: blog.data.keywords.length ? blog.data.keywords : undefined,
      alternates: canonical(`/blog/${slug}`),
      openGraph: {
        type: "article",
        title: blog.data.title,
        description: blog.data.excerpt ?? undefined,
        url: absoluteUrl(`/blog/${slug}`),
        publishedTime: blog.data.publishedAt ?? undefined,
        authors: blog.data.authorName ? [blog.data.authorName] : undefined,
        images: blog.data.coverImage
          ? [{ url: blog.data.coverImage }]
          : undefined,
      },
    };
  } catch {
    return {
      title: "Tulisan tidak ditemukan",
      robots: { index: false, follow: false },
    };
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  /// Draf dan slug yang tidak ada sama-sama dijawab "tidak ditemukan" oleh
  /// server, jadi keduanya mendarat di halaman 404 yang sama.
  const blog = await fetchPublicBlogBySlug(slug).catch(() => null);
  if (!blog) notFound();

  /// Satu lebih banyak dari yang ditampilkan, karena tulisan ini sendiri ikut
  /// terbawa lalu disaring.
  const related = blog.data.categorySlug
    ? await fetchPublicBlogs({
        category: blog.data.categorySlug,
        limit: 4,
      }).catch(() => null)
    : null;

  const relatedItems =
    related?.data.filter((item) => item.id !== blog.data.id).slice(0, 3) ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-12">
      {/* Menyatakan ini tulisan blog, kapan terbit, dan siapa penulisnya —
          keterangan yang tidak bisa disimpulkan mesin dari tampilan. */}
      <JsonLd data={articleSchema(blog.data)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Beranda", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: blog.data.title, path: `/blog/${slug}` },
        ])}
      />

      <Link
        href="/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} />
        Kembali ke blog
      </Link>

      <article>
        <header className="mb-6">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {blog.data.categoryName && blog.data.categorySlug && (
              <Link
                href={`/blog?category=${blog.data.categorySlug}`}
                className="rounded-full bg-primary/10 px-2 py-0.5 text-primary"
              >
                {blog.data.categoryName}
              </Link>
            )}
            {blog.data.publishedAt && (
              <time dateTime={blog.data.publishedAt}>
                {dayjs(blog.data.publishedAt)
                  .locale("id")
                  .format("DD MMMM YYYY")}
              </time>
            )}
            {blog.data.authorName && <span>· {blog.data.authorName}</span>}
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">
            {blog.data.title}
          </h1>

          {blog.data.excerpt && (
            <p className="mt-3 text-muted-foreground">{blog.data.excerpt}</p>
          )}
        </header>

        {blog.data.coverImage && (
          <div className="relative mb-8 aspect-video overflow-hidden rounded-xl bg-muted">
            <Image
              src={blog.data.coverImage}
              alt={blog.data.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}

        {/*
          Isi tulisan sudah dibersihkan di server sebelum disimpan
          (`blog.sanitize.ts`), jadi yang sampai ke sini hanya tag yang
          diizinkan. Pembersihan tetap dilakukan di server, bukan di sini,
          supaya isinya tidak pernah tersimpan dalam keadaan kotor.
        */}
        <div
          className="rich-text text-foreground/90"
          dangerouslySetInnerHTML={{ __html: blog.data.content }}
        />

        {blog.data.keywords.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
            {/* Tag mengantar pembaca ke tulisan lain bertag sama — itu gunanya
                tag, bukan sekadar hiasan di bawah artikel. */}
            {blog.data.keywords.map((keyword) => (
              <Link
                key={keyword}
                href={`/blog?tag=${encodeURIComponent(keyword)}`}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                #{keyword}
              </Link>
            ))}
          </div>
        )}
      </article>

      {relatedItems.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display mb-4 text-xl font-semibold">
            Tulisan lainnya
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((item) => (
              <BlogCard key={item.id} blog={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
