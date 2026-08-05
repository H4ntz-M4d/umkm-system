/*
  Warnings:

  - You are about to drop the `product_pre_order` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "product_pre_order" DROP CONSTRAINT "product_pre_order_productMasterId_fkey";

-- DropTable
DROP TABLE "product_pre_order";

-- CreateTable
CREATE TABLE "product_pre_order_details" (
    "id" BIGSERIAL NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "quotaTarget" INTEGER NOT NULL,
    "maxQuota" INTEGER NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pre_order_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_pre_order_details_productVariantId_key" ON "product_pre_order_details"("productVariantId");

-- AddForeignKey
ALTER TABLE "product_pre_order_details" ADD CONSTRAINT "product_pre_order_details_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
