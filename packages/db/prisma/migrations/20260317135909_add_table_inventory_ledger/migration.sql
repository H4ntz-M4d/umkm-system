-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('RAW_MATERIAL', 'PRODUCT_VARIANT');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('PURCHASE', 'PRODUCTION', 'POS', 'ONLINE_ORDER', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "InventoryLedger" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemId" BIGINT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryLedger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryLedger_storeId_itemType_itemId_idx" ON "InventoryLedger"("storeId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "InventoryLedger" ADD CONSTRAINT "InventoryLedger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
