/*
  Warnings:

  - You are about to alter the column `name` on the `RawMaterial` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `unit` on the `RawMaterial` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- DropForeignKey
ALTER TABLE "ProductionMaterial" DROP CONSTRAINT "ProductionMaterial_productionId_fkey";

-- AlterTable
ALTER TABLE "RawMaterial" ADD COLUMN     "cost" DECIMAL(18,2),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "unit" SET DATA TYPE VARCHAR(100);

-- AddForeignKey
ALTER TABLE "ProductionMaterial" ADD CONSTRAINT "ProductionMaterial_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "Production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
