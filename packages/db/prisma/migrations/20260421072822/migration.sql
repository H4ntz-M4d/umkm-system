/*
  Warnings:

  - You are about to alter the column `itemName` on the `expense_item` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `unit` on the `expense_item` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - A unique constraint covering the columns `[storeId]` on the table `expense` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "expense_category" ADD COLUMN     "isMaterialsCategory" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "expense_item" ADD COLUMN     "rawMaterialId" BIGINT,
ALTER COLUMN "itemName" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "unit" SET DATA TYPE VARCHAR(100);

-- CreateIndex
CREATE UNIQUE INDEX "expense_storeId_key" ON "expense"("storeId");

-- AddForeignKey
ALTER TABLE "expense_item" ADD CONSTRAINT "expense_item_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_material"("id") ON DELETE CASCADE ON UPDATE CASCADE;
