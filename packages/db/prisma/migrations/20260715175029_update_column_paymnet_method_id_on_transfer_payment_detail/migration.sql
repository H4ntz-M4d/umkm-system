/*
  Warnings:

  - You are about to drop the column `bankAccountId` on the `transfer_payment_detail` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "transfer_payment_detail" DROP CONSTRAINT "transfer_payment_detail_bankAccountId_fkey";

-- AlterTable
ALTER TABLE "transfer_payment_detail" DROP COLUMN "bankAccountId",
ADD COLUMN     "paymentMethodId" BIGINT;

-- AddForeignKey
ALTER TABLE "transfer_payment_detail" ADD CONSTRAINT "transfer_payment_detail_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
