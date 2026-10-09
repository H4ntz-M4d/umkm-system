import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { BlogStatusEnum } from "./blog.schema";

export const BlogCategoryData = z.object({
  id: z.coerce.string(),
  name: z.string(),
  slug: z.string(),
  blogCount: z.number().default(0),
});

/// Bentuk daftar: tanpa isi tulisan, karena daftar tidak menampilkannya dan
/// isinya bisa sangat panjang.
export const BlogListItemData = z.object({
  id: z.coerce.string(),
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable(),
  coverImage: z.string().nullable(),
  status: BlogStatusEnum,
  publishedAt: z
    .union([z.date(), z.string()])
    .nullable()
    .transform((value) => (value ? String(value) : null)),
  createdAt: z.union([z.date(), z.string()]).transform((value) => String(value)),
  categoryName: z.string().nullable(),
  categorySlug: z.string().nullable(),
  authorName: z.string().nullable(),
  /// Tag ikut di daftar supaya tabel admin dan kartu blog bisa
  /// menampilkannya tanpa memuat isi tulisan.
  keywords: z.array(z.string()).default([]),
});

export const BlogDetailData = BlogListItemData.extend({
  content: z.string(),
  categoryId: z.coerce.string().nullable(),
});

export type BlogListItemDataType = z.infer<typeof BlogListItemData>;
export type BlogDetailDataType = z.infer<typeof BlogDetailData>;
export type BlogCategoryDataType = z.infer<typeof BlogCategoryData>;

export const BlogListResponse = ApiSuccessResponse(z.array(BlogListItemData));
export const BlogDetailResponse = ApiSuccessResponse(BlogDetailData);
export const BlogCategoryListResponse = ApiSuccessResponse(
  z.array(BlogCategoryData),
);
export const BlogCategoryResponse = ApiSuccessResponse(BlogCategoryData);

/// Balasan unggahan sampul: hanya URL gambarnya, karena tulisannya sendiri
/// disimpan lewat permintaan terpisah.
export const BlogCoverResponse = ApiSuccessResponse(
  z.object({ image: z.string() }),
);
