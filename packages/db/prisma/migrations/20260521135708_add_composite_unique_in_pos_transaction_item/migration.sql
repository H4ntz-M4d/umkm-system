/*
  Warnings:

  - The values [ACTIVE] on the enum `PosStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[posTransactionId,productVariantId]` on the table `pos_transaction_item` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PosStatus_new" AS ENUM ('DRAFT', 'PARKED', 'PAID', 'CANCELLED');
ALTER TABLE "pos_transaction" ALTER COLUMN "status" TYPE "PosStatus_new" USING ("status"::text::"PosStatus_new");
ALTER TYPE "PosStatus" RENAME TO "PosStatus_old";
ALTER TYPE "PosStatus_new" RENAME TO "PosStatus";
DROP TYPE "public"."PosStatus_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "pos_transaction_item_posTransactionId_productVariantId_key" ON "pos_transaction_item"("posTransactionId", "productVariantId");
