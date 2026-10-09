import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from "./site";
import { SHOP_WHATSAPP_NUMBER } from "../../../utils/whatsapp";

/**
 * Data terstruktur (JSON-LD) untuk mesin pencari dan asisten AI.
 *
 * Isinya keterangan yang tidak terbaca dari tampilan: ini produk atau artikel,
 * harganya berapa, stoknya ada atau tidak, penjualnya siapa. Google memakainya
 * untuk menampilkan harga dan stok langsung di hasil pencarian, dan model
 * bahasa memakainya untuk memahami toko ini tanpa menebak dari susunan HTML.
 *
 * Aturan yang dipegang berkas ini: JSON-LD hanya boleh menyatakan apa yang
 * benar-benar tampil di halaman. Menyatakan hal yang tidak ada di halaman —
 * mis. rating palsu — melanggar pedoman Google dan bisa membuat seluruh situs
 * kehilangan tampilan kayanya.
 */

/// Akun resmi toko. Dipakai `sameAs` supaya mesin pencari tahu bahwa akun-akun
/// ini dan situs ini adalah usaha yang sama.
const SOCIAL_PROFILES = [
  "https://www.instagram.com/nurfacraft_jogja",
  "https://www.tiktok.com/@tasrajutjogjanurfa",
  "https://www.facebook.com/tasrajutjogjanurfa",
];

/// Id tetap untuk entitas toko. Dengan id ini, Produk dan Artikel cukup
/// menunjuk ke toko yang sama alih-alih menyalin ulang keterangannya.
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Menyisipkan satu blok JSON-LD.
 *
 * `<` diubah jadi urutan escape supaya isi data yang kebetulan memuat
 * `</script>` tidak bisa menutup tag lebih awal dan menyuntikkan skrip.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Identitas toko: siapa, di mana, dan bisa dihubungi lewat apa.
 *
 * Dipasang di seluruh halaman publik. Alamat jalan sengaja belum dicantumkan
 * karena owner belum memberikannya — lebih baik tidak menyebut daripada
 * menyebut alamat yang salah, yang justru merusak kepercayaan mesin pencari.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    /// Google hanya menerima gambar raster untuk `logo`, dan memakainya di
    /// panel merek. Dipakai versi 512px, bukan berkas asli 1,5 MB.
    logo: absoluteUrl("/logo-512.png"),
    image: absoluteUrl("/opengraph-image"),
    areaServed: "ID",
    knowsLanguage: ["id", "en"],
    sameAs: SOCIAL_PROFILES,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: `+${SHOP_WHATSAPP_NUMBER}`,
        availableLanguage: ["id"],
        url: `https://wa.me/${SHOP_WHATSAPP_NUMBER}`,
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "id-ID",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/**
 * Jejak navigasi yang ikut tampil di hasil pencarian, menggantikan alamat
 * panjang dengan jalur yang terbaca: Beranda › Koleksi › Nama Produk.
 */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

type ProductForSchema = {
  name: string;
  slug: string;
  description: string;
  image: string | null;
  priceMin: string;
  priceMax: string;
  totalStock: number;
  categoryName: string | null;
  variants?: { sku: string; price: string; stock: number }[];
};

/**
 * Keterangan produk beserta penawarannya.
 *
 * Harga dikirim sebagai rentang (`AggregateOffer`) ketika variannya berbeda
 * harga, dan sebagai satu harga bila seragam — itu yang sebenarnya dilihat
 * pembeli di halaman, jadi itu pula yang dinyatakan.
 *
 * Ketersediaan dihitung dari stok sungguhan. Produk yang stoknya habis tetap
 * dinyatakan apa adanya (`OutOfStock`): menyatakan tersedia padahal kosong
 * membuat pembeli datang lalu kecewa, dan Google menandainya sebagai data
 * yang tidak cocok dengan halaman.
 */
export function productSchema(product: ProductForSchema) {
  const url = absoluteUrl(`/products/${product.slug}`);
  const availability =
    product.totalStock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const priceMin = Number(product.priceMin);
  const priceMax = Number(product.priceMax);
  const hasRange = Number.isFinite(priceMin) && priceMin !== priceMax;

  const offers = hasRange
    ? {
        "@type": "AggregateOffer",
        priceCurrency: "IDR",
        lowPrice: priceMin,
        highPrice: priceMax,
        offerCount: product.variants?.length ?? 1,
        availability,
        url,
        seller: { "@id": ORGANIZATION_ID },
      }
    : {
        "@type": "Offer",
        priceCurrency: "IDR",
        price: priceMin,
        availability,
        url,
        itemCondition: "https://schema.org/NewCondition",
        seller: { "@id": ORGANIZATION_ID },
      };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    url,
    ...(product.image && { image: [product.image] }),
    ...(product.categoryName && { category: product.categoryName }),
    /// SKU hanya disebut bila produknya memang satu varian; pada produk
    /// bervarian, SKU-nya berbeda-beda dan tidak ada satu pun yang mewakili.
    ...(product.variants?.length === 1 && { sku: product.variants[0].sku }),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers,
  };
}

type ArticleForSchema = {
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  authorName: string | null;
  keywords: string[];
};

/// Artikel blog: judul, tanggal tayang, penulis, dan gambar sampulnya.
export function articleSchema(article: ArticleForSchema) {
  const url = absoluteUrl(`/blog/${article.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    url,
    mainEntityOfPage: url,
    inLanguage: "id-ID",
    ...(article.excerpt && { description: article.excerpt }),
    ...(article.coverImage && { image: [article.coverImage] }),
    ...(article.publishedAt && { datePublished: article.publishedAt }),
    ...(article.keywords.length > 0 && { keywords: article.keywords }),
    author: article.authorName
      ? { "@type": "Person", name: article.authorName }
      : { "@id": ORGANIZATION_ID },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/// Daftar tanya jawab di halaman Tentang Kami. Isinya wajib sama persis
/// dengan yang terbaca pengunjung di halaman itu.
export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
}
