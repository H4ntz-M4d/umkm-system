/*
  Warnings:

  - You are about to drop the column `available_stock` on the `product_variant_stock` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pos_transaction" DROP CONSTRAINT "pos_transaction_cashierId_fkey";

-- AlterTable
ALTER TABLE "pos_transaction" ALTER COLUMN "paymentMethodId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product_variant_stock" DROP COLUMN "available_stock";

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;
