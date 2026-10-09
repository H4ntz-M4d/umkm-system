-- Blog untuk storefront.
--
-- Isinya HTML dari editor berformat; pembersihannya dilakukan di service
-- sebelum baris ini ditulis, bukan diserahkan ke sisi tampilan.
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "blog_category" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blog" (
    "id" BIGSERIAL NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "excerpt" VARCHAR(300),
    "content" TEXT NOT NULL,
    "coverImage" VARCHAR(500),
    "keywords" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "categoryId" BIGINT,
    "userId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blog_category_slug_key" ON "blog_category"("slug");
CREATE UNIQUE INDEX "blog_slug_key" ON "blog"("slug");
CREATE INDEX "blog_status_publishedAt_idx" ON "blog"("status", "publishedAt");
CREATE INDEX "blog_categoryId_idx" ON "blog"("categoryId");

-- SET NULL keduanya: menghapus kategori atau akun penulis tidak boleh ikut
-- menghapus tulisan yang sudah terbit.
ALTER TABLE "blog" ADD CONSTRAINT "blog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "blog" ADD CONSTRAINT "blog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
