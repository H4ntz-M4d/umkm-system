/*
  Warnings:

  - You are about to drop the column `bank` on the `transfer_payment_detail` table. All the data in the column will be lost.
  - You are about to alter the column `paymentProof` on the `transfer_payment_detail` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(255)`.
  - Added the required column `bankAccountId` to the `transfer_payment_detail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transfer_payment_detail" DROP COLUMN "bank",
ADD COLUMN     "bankAccountId" BIGINT NOT NULL,
ALTER COLUMN "paymentProof" SET DATA TYPE VARCHAR(255);

-- AddForeignKey
ALTER TABLE "transfer_payment_detail" ADD CONSTRAINT "transfer_payment_detail_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
