/*
  Warnings:

  - The values [QRIS] on the enum `PaymentChannel` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[transactionId]` on the table `QrisPaymentDetail` will be added. If there are existing duplicate values, this will fail.
  - Made the column `transactionId` on table `QrisPaymentDetail` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentChannel_new" AS ENUM ('CASH', 'MIDTRANS', 'BANK_TRANSFER');
ALTER TABLE "payment_method" ALTER COLUMN "channel" TYPE "PaymentChannel_new" USING ("channel"::text::"PaymentChannel_new");
ALTER TYPE "PaymentChannel" RENAME TO "PaymentChannel_old";
ALTER TYPE "PaymentChannel_new" RENAME TO "PaymentChannel";
DROP TYPE "public"."PaymentChannel_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "QrisPaymentDetail" DROP CONSTRAINT "QrisPaymentDetail_transactionId_fkey";

-- AlterTable
ALTER TABLE "QrisPaymentDetail" ALTER COLUMN "transactionId" SET NOT NULL;

-- CreateTable
CREATE TABLE "transfer_payment_detail" (
    "id" BIGSERIAL NOT NULL,
    "transactionId" BIGINT NOT NULL,
    "bank" VARCHAR(50) NOT NULL,
    "paymentProof" VARCHAR(500),
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "transfer_payment_detail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transfer_payment_detail_transactionId_key" ON "transfer_payment_detail"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "QrisPaymentDetail_transactionId_key" ON "QrisPaymentDetail"("transactionId");

-- AddForeignKey
ALTER TABLE "QrisPaymentDetail" ADD CONSTRAINT "QrisPaymentDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "pos_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transfer_payment_detail" ADD CONSTRAINT "transfer_payment_detail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "pos_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
