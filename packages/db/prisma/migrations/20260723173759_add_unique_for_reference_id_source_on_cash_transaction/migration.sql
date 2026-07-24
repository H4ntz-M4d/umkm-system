/*
  Warnings:

  - A unique constraint covering the columns `[referenceId,source]` on the table `cash_transaction` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cash_transaction_referenceId_source_key" ON "cash_transaction"("referenceId", "source");
