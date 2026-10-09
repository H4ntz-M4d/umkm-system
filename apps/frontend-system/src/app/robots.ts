import type { MetadataRoute } from "next";
import { absoluteUrl, isSiteUrlConfigured } from "@/lib/seo/site";

/**
 * Aturan untuk perayap mesin pencari.
 *
 * Halaman milik pengguna (keranjang, checkout, profil, pesanan) dan seluruh
 * layar pengelolaan ditutup. Halaman seperti itu tidak berguna di hasil
 * pencarian, dan isinya yang tipis justru menurunkan penilaian mutu situs
 * secara keseluruhan.
 */
export default function robots(): MetadataRoute.Robots {
  /**
   * Selama alamat asli situs belum diisi (`NEXT_PUBLIC_SITE_URL`), seluruh
   * situs ditutup dari mesin pencari.
   *
   * Ini memang keras, tapi kegagalannya diam-diam jauh lebih mahal: tanpa
   * alamat yang benar, canonical menunjuk ke localhost, dan Google akan
   * diberi tahu bahwa halaman aslinya ada di komputer yang tidak bisa
   * dijangkau siapa pun. Lebih baik belum terindeks daripada terindeks salah.
   */
  if (!isSiteUrlConfigured) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/management/",
        "/point-of-sale/",
        "/cart",
        "/checkout",
        "/profile",
        "/orders",
        "/wishlist",
        "/login",
        "/forgot-password",
        "/auth/",
        "/access-denied",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
