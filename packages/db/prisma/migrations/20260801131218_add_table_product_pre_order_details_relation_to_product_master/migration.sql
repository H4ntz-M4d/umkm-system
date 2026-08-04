/*
  Warnings:

  - You are about to drop the column `productVariantId` on the `product_pre_order_details` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[productMasterId]` on the table `product_pre_order_details` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productMasterId` to the `product_pre_order_details` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "product_pre_order_details" DROP CONSTRAINT "product_pre_order_details_productVariantId_fkey";

-- DropIndex
DROP INDEX "product_pre_order_details_productVariantId_key";

-- AlterTable
ALTER TABLE "product_pre_order_details" DROP COLUMN "productVariantId",
ADD COLUMN     "productMasterId" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "product_pre_order_details_productMasterId_key" ON "product_pre_order_details"("productMasterId");

-- AddForeignKey
ALTER TABLE "product_pre_order_details" ADD CONSTRAINT "product_pre_order_details_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
