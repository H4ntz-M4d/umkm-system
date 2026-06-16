/*
  Warnings:

  - The values [MANUAL] on the enum `PaymentChannel` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT] on the enum `PosStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PaymentChannel_new" AS ENUM ('CASH', 'MIDTRANS', 'BANK_TRANSFER', 'QRIS');
ALTER TABLE "payment_method" ALTER COLUMN "channel" TYPE "PaymentChannel_new" USING ("channel"::text::"PaymentChannel_new");
ALTER TYPE "PaymentChannel" RENAME TO "PaymentChannel_old";
ALTER TYPE "PaymentChannel_new" RENAME TO "PaymentChannel";
DROP TYPE "public"."PaymentChannel_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PosStatus_new" AS ENUM ('PENDING', 'PARKED', 'PAID', 'CANCELLED');
ALTER TABLE "pos_transaction" ALTER COLUMN "status" TYPE "PosStatus_new" USING ("status"::text::"PosStatus_new");
ALTER TYPE "PosStatus" RENAME TO "PosStatus_old";
ALTER TYPE "PosStatus_new" RENAME TO "PosStatus";
DROP TYPE "public"."PosStatus_old";
COMMIT;

-- CreateTable
CREATE TABLE "QrisPaymentDetail" (
    "id" TEXT NOT NULL,
    "transactionId" BIGINT,
    "midtransId" TEXT,
    "qrString" TEXT,
    "qrUrl" TEXT,
    "qrExpiresAt" TIMESTAMP(3),

    CONSTRAINT "QrisPaymentDetail_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "QrisPaymentDetail" ADD CONSTRAINT "QrisPaymentDetail_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "pos_transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
