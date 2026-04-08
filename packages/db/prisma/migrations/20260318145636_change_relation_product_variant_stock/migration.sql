/*
  Warnings:

  - A unique constraint covering the columns `[productVariantId]` on the table `product_variant_stock` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "product_variant_stock_productVariantId_key" ON "product_variant_stock"("productVariantId");
