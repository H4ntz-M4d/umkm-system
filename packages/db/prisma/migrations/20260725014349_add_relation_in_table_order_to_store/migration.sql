/*
  Warnings:

  - You are about to drop the column `branchId` on the `order` table. All the data in the column will be lost.
  - Added the required column `storeId` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "branchId",
ADD COLUMN     "storeId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
