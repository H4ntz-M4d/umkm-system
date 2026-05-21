/*
  Warnings:

  - A unique constraint covering the columns `[orderId]` on the table `order` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transId]` on the table `pos_transaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderId` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transId` to the `pos_transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" ADD COLUMN     "orderId" VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE "pos_transaction" ADD COLUMN     "transId" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "order_orderId_key" ON "order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_transaction_transId_key" ON "pos_transaction"("transId");
