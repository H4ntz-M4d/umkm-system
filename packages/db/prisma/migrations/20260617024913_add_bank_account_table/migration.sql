/*
  Warnings:

  - You are about to drop the column `code` on the `payment_method` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentMethodId]` on the table `pos_transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "payment_method_code_key";

-- AlterTable
ALTER TABLE "payment_method" DROP COLUMN "code";

-- CreateTable
CREATE TABLE "bank_account" (
    "id" BIGSERIAL NOT NULL,
    "paymentMethodId" BIGINT NOT NULL,
    "bankName" VARCHAR(100) NOT NULL,
    "accountNumber" VARCHAR(50) NOT NULL,
    "accountName" VARCHAR(100) NOT NULL,

    CONSTRAINT "bank_account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bank_account_paymentMethodId_key" ON "bank_account"("paymentMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_transaction_paymentMethodId_key" ON "pos_transaction"("paymentMethodId");

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
