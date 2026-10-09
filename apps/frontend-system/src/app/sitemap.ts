import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";
import { fetchPublicProducts } from "@/lib/queries/public/products.query";
import { fetchPublicBlogs } from "@/lib/queries/public/blog.query";

/// Batas aman sekali ambil. Katalog dan blog Nurfa Craft masih jauh di bawah
/// ini; kalau kelak melewatinya, sitemap perlu dipecah per bagian.
const MAX_ENTRIES = 1000;

/// Sitemap dirakit ulang paling cepat sekali sehari. Produk dan tulisan baru
/// tidak muncul seketika, dan itu memang tidak perlu — yang penting Google
/// tidak diminta merayapi ulang tiap kali ada yang membuka halamannya.
export const revalidate = 86400;

/**
 * Daftar halaman yang boleh diindeks.
 *
 * Halaman statis ditulis di sini, sedangkan produk dan artikel diambil dari
 * backend supaya tidak perlu diperbarui tangan tiap ada tambahan.
 *
 * Kegagalan mengambil data sengaja tidak dilempar: sitemap yang berisi
 * halaman statis saja masih berguna, sedangkan sitemap yang gagal total
 * membuat Google kehilangan seluruh petunjuknya sekaligus.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/products"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/blog"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/reseller"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const [products, blogs] = await Promise.all([
    fetchPublicProducts({ limit: MAX_ENTRIES }).catch(() => null),
    fetchPublicBlogs({ limit: MAX_ENTRIES }).catch(() => null),
  ]);

  const productPages: MetadataRoute.Sitemap = (products?.data ?? []).map(
    (product) => ({
      url: absoluteUrl(`/products/${product.slug}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const blogPages: MetadataRoute.Sitemap = (blogs?.data ?? []).map((blog) => ({
    url: absoluteUrl(`/blog/${blog.slug}`),
    /// Tanggal tayang dipakai apa adanya: itu yang memberi tahu Google
    /// tulisan mana yang benar-benar baru.
    lastModified: blog.publishedAt ? new Date(blog.publishedAt) : now,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...productPages, ...blogPages];
}
