import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

export const BlogStatusEnum = z.enum(["DRAFT", "PUBLISHED"]);

export type BlogStatusInput = z.infer<typeof BlogStatusEnum>;

/// Batas kata kunci metadata. Lebih dari ini bukan lagi menolong mesin
/// pencari, melainkan dianggap penjejalan kata kunci.
export const BLOG_KEYWORD_MAX = 10;

export const BlogSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(200),
  /// Bagian URL tulisan. Diisi otomatis dari judul di form, tapi tetap bisa
  /// disunting karena URL yang sudah tersebar sebaiknya tidak berubah.
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter")
    .max(220)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung",
    ),
  excerpt: z.string().trim().max(300, "Ringkasan maksimal 300 karakter").optional(),
  content: z.string().min(1, "Isi tulisan belum diisi"),
  coverImage: z.string().optional().nullable(),
  keywords: z
    .array(z.string().trim().min(1).max(50))
    .max(BLOG_KEYWORD_MAX, `Maksimal ${BLOG_KEYWORD_MAX} kata kunci`)
    .default([]),
  status: BlogStatusEnum.default("DRAFT"),
  categoryId: z.string().optional().nullable(),
});

export const BlogCategorySchema = z.object({
  name: z.string().trim().min(2, "Nama kategori minimal 2 karakter").max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug hanya boleh huruf kecil, angka, dan tanda hubung",
    ),
});

export const BlogQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  status: BlogStatusEnum.optional(),
  categoryId: z.string().optional(),
});

/// Query sisi publik: tanpa status, karena yang tampil hanya yang terbit.
export const PublicBlogQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  category: z.string().optional(),
  /// Satu tag yang diklik pembaca di halaman artikel.
  tag: z.string().optional(),
});

export type BlogSchemaInput = z.input<typeof BlogSchema>;
export type BlogCategorySchemaInput = z.input<typeof BlogCategorySchema>;
export type BlogQueryInput = z.infer<typeof BlogQuerySchema>;
export type PublicBlogQueryInput = z.infer<typeof PublicBlogQuerySchema>;
