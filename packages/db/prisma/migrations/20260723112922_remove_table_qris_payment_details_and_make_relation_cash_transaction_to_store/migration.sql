/*
  Warnings:

  - You are about to drop the column `branchId` on the `cash_transaction` table. All the data in the column will be lost.
  - You are about to drop the `QrisPaymentDetail` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `storeId` to the `cash_transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QrisPaymentDetail" DROP CONSTRAINT "QrisPaymentDetail_transactionId_fkey";

-- AlterTable
ALTER TABLE "cash_transaction" DROP COLUMN "branchId",
ADD COLUMN     "storeId" BIGINT NOT NULL;

-- DropTable
DROP TABLE "QrisPaymentDetail";

-- AddForeignKey
ALTER TABLE "cash_transaction" ADD CONSTRAINT "cash_transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
