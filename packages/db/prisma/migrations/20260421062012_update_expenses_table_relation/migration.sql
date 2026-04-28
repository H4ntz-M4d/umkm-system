/*
  Warnings:

  - You are about to drop the column `branchId` on the `expense` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `expense` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense" DROP COLUMN "branchId",
ADD COLUMN     "storeId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
