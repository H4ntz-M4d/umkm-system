import { Prisma } from '@repo/db';

export const blogInclude = {
  category: { select: { name: true, slug: true } },
  user: { select: { employees: { select: { name: true } } } },
} satisfies Prisma.BlogInclude;

type BlogEntity = Prisma.BlogGetPayload<{ include: typeof blogInclude }>;

/// Bentuk daftar: tanpa isi tulisan, yang bisa sangat panjang dan tidak
/// pernah ditampilkan di kartu.
export function toBlogListResponse(entity: BlogEntity) {
  return {
    id: entity.id,
    title: entity.title,
    slug: entity.slug,
    excerpt: entity.excerpt,
    coverImage: entity.coverImage,
    status: entity.status,
    publishedAt: entity.publishedAt,
    createdAt: entity.createdAt,
    categoryName: entity.category?.name ?? null,
    categorySlug: entity.category?.slug ?? null,
    authorName: entity.user?.employees?.name ?? null,
    keywords: entity.keywords,
  };
}

export function toBlogDetailResponse(entity: BlogEntity) {
  return {
    ...toBlogListResponse(entity),
    content: entity.content,
    categoryId: entity.categoryId,
  };
}

type BlogCategoryEntity = Prisma.BlogCategoryGetPayload<{
  include: { _count: { select: { blogs: true } } };
}>;

export function toBlogCategoryResponse(entity: BlogCategoryEntity) {
  return {
    id: entity.id,
    name: entity.name,
    slug: entity.slug,
    blogCount: entity._count.blogs,
  };
}
