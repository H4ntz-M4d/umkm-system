-- AlterTable
ALTER TABLE "product_master" ADD COLUMN     "categoryId" BIGINT;

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
