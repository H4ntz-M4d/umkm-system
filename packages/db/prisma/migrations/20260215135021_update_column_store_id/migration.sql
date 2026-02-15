-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_storeId_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "storeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
