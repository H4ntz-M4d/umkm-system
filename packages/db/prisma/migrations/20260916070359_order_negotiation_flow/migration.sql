/*
  Warnings:

  - Added the required column `estimatedTotal` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "OrderDeliveryMethod" AS ENUM ('SHIP', 'PICKUP');

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'DP';

-- DropForeignKey
ALTER TABLE "order" DROP CONSTRAINT "order_paymentMethodId_fkey";

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "buyerName" VARCHAR(150),
ADD COLUMN     "buyerPhone" VARCHAR(30),
ADD COLUMN     "deliveryMethod" "OrderDeliveryMethod" NOT NULL DEFAULT 'SHIP',
ADD COLUMN     "dpAmount" DECIMAL(65,30),
ADD COLUMN     "estimatedTotal" DECIMAL(65,30),
ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- Backfill: untuk order lama, totalAmount memang berarti akumulasi harga
-- katalog (perilaku checkout() lama) -- jadi nilai itu yang paling akurat
-- dipakai sebagai estimatedTotal-nya, bukan 0 atau NULL.
UPDATE "order" SET "estimatedTotal" = "totalAmount" WHERE "estimatedTotal" IS NULL;

ALTER TABLE "order" ALTER COLUMN "estimatedTotal" SET NOT NULL;

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "notes" VARCHAR(500);

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;
