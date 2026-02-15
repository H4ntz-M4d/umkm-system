-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'NONACTIVE', 'DRAFT');

-- CreateTable
CREATE TABLE "product_master" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "useVariant" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "cost" DECIMAL(18,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_type" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "product_variant_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_value" (
    "id" BIGSERIAL NOT NULL,
    "variantTypeId" BIGINT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "product_variant_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option" (
    "id" BIGSERIAL NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "variantValueId" BIGINT NOT NULL,

    CONSTRAINT "product_variant_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_master_slug_key" ON "product_master"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_key" ON "product_variant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_productMasterId_idx" ON "product_variant"("productMasterId");

-- CreateIndex
CREATE INDEX "product_variant_type_productMasterId_idx" ON "product_variant_type"("productMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_type_productMasterId_name_key" ON "product_variant_type"("productMasterId", "name");

-- CreateIndex
CREATE INDEX "product_variant_value_variantTypeId_idx" ON "product_variant_value"("variantTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_value_variantTypeId_value_key" ON "product_variant_value"("variantTypeId", "value");

-- CreateIndex
CREATE INDEX "product_variant_option_productVariantId_idx" ON "product_variant_option"("productVariantId");

-- CreateIndex
CREATE INDEX "product_variant_option_variantValueId_idx" ON "product_variant_option"("variantValueId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_option_productVariantId_variantValueId_key" ON "product_variant_option"("productVariantId", "variantValueId");

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_type" ADD CONSTRAINT "product_variant_type_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_value" ADD CONSTRAINT "product_variant_value_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "product_variant_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_variantValueId_fkey" FOREIGN KEY ("variantValueId") REFERENCES "product_variant_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;
