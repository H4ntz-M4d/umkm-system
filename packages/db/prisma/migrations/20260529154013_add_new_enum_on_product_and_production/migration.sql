-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MADE_TO_ORDER', 'PRE_ORDER', 'READY_STOCK');

-- CreateEnum
CREATE TYPE "ProductionType" AS ENUM ('RESTOCK', 'MADE_TO_ORDER', 'BE_SPOKE', 'PRE_ORDER');

-- AlterTable
ALTER TABLE "product_master" ADD COLUMN     "type" "ProductType" NOT NULL DEFAULT 'MADE_TO_ORDER';

-- AlterTable
ALTER TABLE "production" ADD COLUMN     "type" "ProductionType" NOT NULL DEFAULT 'RESTOCK';
