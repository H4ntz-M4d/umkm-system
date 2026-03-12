/*
  Warnings:

  - You are about to alter the column `name` on the `customer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `email` on the `customer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `phone` on the `customer` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `product_master` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `slug` on the `product_master` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `sku` on the `product_variant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `name` on the `product_variant_type` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `value` on the `product_variant_value` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - A unique constraint covering the columns `[email]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - Made the column `email` on table `customer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "image" VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "phone" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "employee" ADD COLUMN     "image" VARCHAR(255),
ALTER COLUMN "address" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_master" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "product_variant" ALTER COLUMN "sku" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "product_variant_type" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "product_variant_value" ALTER COLUMN "value" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "slug" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");
