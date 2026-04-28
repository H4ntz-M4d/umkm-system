-- DropIndex
DROP INDEX "expense_storeId_key";

-- AlterTable
ALTER TABLE "expense_item" ALTER COLUMN "itemName" DROP NOT NULL;
