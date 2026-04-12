/*
  Warnings:

  - You are about to drop the `InventoryLedger` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Production` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductionMaterial` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RawMaterial` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "InventoryLedger" DROP CONSTRAINT "InventoryLedger_storeId_fkey";

-- DropForeignKey
ALTER TABLE "Production" DROP CONSTRAINT "Production_producedVariantId_fkey";

-- DropForeignKey
ALTER TABLE "Production" DROP CONSTRAINT "Production_storeId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionMaterial" DROP CONSTRAINT "ProductionMaterial_productionId_fkey";

-- DropForeignKey
ALTER TABLE "ProductionMaterial" DROP CONSTRAINT "ProductionMaterial_rawMaterialId_fkey";

-- DropTable
DROP TABLE "InventoryLedger";

-- DropTable
DROP TABLE "Production";

-- DropTable
DROP TABLE "ProductionMaterial";

-- DropTable
DROP TABLE "RawMaterial";

-- CreateTable
CREATE TABLE "raw_material" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "cost" DECIMAL(18,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "raw_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raw_material_stock" (
    "id" BIGSERIAL NOT NULL,
    "rawMaterialId" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL,
    "reservedStock" INTEGER NOT NULL,
    "availableStock" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "raw_material_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ledger" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemId" BIGINT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "producedVariantId" BIGINT NOT NULL,
    "quantityProduced" INTEGER NOT NULL,
    "status" "ProductionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_material" (
    "id" BIGSERIAL NOT NULL,
    "productionId" BIGINT NOT NULL,
    "rawMaterialId" BIGINT NOT NULL,
    "quantityUsed" INTEGER NOT NULL,

    CONSTRAINT "production_material_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "raw_material_stock_rawMaterialId_key" ON "raw_material_stock"("rawMaterialId");

-- CreateIndex
CREATE INDEX "inventory_ledger_storeId_itemType_itemId_idx" ON "inventory_ledger"("storeId", "itemType", "itemId");

-- AddForeignKey
ALTER TABLE "raw_material_stock" ADD CONSTRAINT "raw_material_stock_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_producedVariantId_fkey" FOREIGN KEY ("producedVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material" ADD CONSTRAINT "production_material_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "production"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_material" ADD CONSTRAINT "production_material_rawMaterialId_fkey" FOREIGN KEY ("rawMaterialId") REFERENCES "raw_material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
