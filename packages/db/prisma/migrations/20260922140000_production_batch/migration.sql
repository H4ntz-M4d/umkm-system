-- Produksi jadi BATCH berisi banyak varian, dengan hasil yang disetor
-- bertahap oleh toko produksi.
--
-- Selama ini satu baris produksi = satu varian yang selesai sekali jadi.
-- Kenyataannya Nurfa Craft merencanakan ratusan pcs lintas varian sekali
-- jalan, dan hasilnya datang sedikit demi sedikit setiap kali selesai dan
-- lolos QC di toko produksi.

CREATE TABLE "production_item" (
    "id" BIGSERIAL NOT NULL,
    "productionId" BIGINT NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "targetQuantity" INTEGER NOT NULL,
    "deliveredQuantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "production_item_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_delivery" (
    "id" BIGSERIAL NOT NULL,
    "productionId" BIGINT NOT NULL,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "userId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "production_delivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_delivery_item" (
    "id" BIGSERIAL NOT NULL,
    "deliveryId" BIGINT NOT NULL,
    "productionItemId" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    CONSTRAINT "production_delivery_item_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "production" ADD COLUMN "code" VARCHAR(100);
ALTER TABLE "production" ADD COLUMN "parentProductionId" BIGINT;
ALTER TABLE "production" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Kode batch untuk data lama. Mengikuti pola kode transaksi lain.
UPDATE "production"
SET "code" = 'PRD-' || to_char("createdAt", 'YYYYMMDD') || '-' || lpad("id"::text, 4, '0')
WHERE "code" IS NULL;

ALTER TABLE "production" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "production_code_key" ON "production"("code");
CREATE INDEX "production_parentProductionId_idx" ON "production"("parentProductionId");

-- Tiap produksi lama jadi batch berisi satu varian.
INSERT INTO "production_item" ("productionId", "productVariantId", "targetQuantity", "deliveredQuantity")
SELECT "id", "producedVariantId", "quantityProduced",
       CASE WHEN "status" = 'COMPLETED' THEN "quantityProduced" ELSE 0 END
FROM "production"
WHERE "producedVariantId" IS NOT NULL;

-- Produksi lama yang sudah selesai dianggap punya satu setoran sejumlah itu,
-- supaya angka kemajuannya benar dan riwayat stoknya tetap masuk akal.
INSERT INTO "production_delivery" ("productionId", "deliveredAt", "note", "createdAt")
SELECT "id", "createdAt", 'Dipindahkan dari catatan produksi lama', "createdAt"
FROM "production"
WHERE "status" = 'COMPLETED' AND "producedVariantId" IS NOT NULL;

INSERT INTO "production_delivery_item" ("deliveryId", "productionItemId", "quantity")
SELECT d."id", i."id", i."targetQuantity"
FROM "production_delivery" d
JOIN "production_item" i ON i."productionId" = d."productionId";

UPDATE "production" SET "completedAt" = "createdAt" WHERE "status" = 'COMPLETED';

ALTER TABLE "production" DROP COLUMN "producedVariantId";
ALTER TABLE "production" DROP COLUMN "quantityProduced";

CREATE UNIQUE INDEX "production_item_productionId_productVariantId_key" ON "production_item"("productionId", "productVariantId");
CREATE INDEX "production_item_productVariantId_idx" ON "production_item"("productVariantId");
CREATE INDEX "production_delivery_productionId_idx" ON "production_delivery"("productionId");
CREATE UNIQUE INDEX "production_delivery_item_deliveryId_productionItemId_key" ON "production_delivery_item"("deliveryId", "productionItemId");

ALTER TABLE "production" ADD CONSTRAINT "production_parentProductionId_fkey" FOREIGN KEY ("parentProductionId") REFERENCES "production"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_item" ADD CONSTRAINT "production_item_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_item" ADD CONSTRAINT "production_item_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "production_delivery" ADD CONSTRAINT "production_delivery_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "production"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_delivery" ADD CONSTRAINT "production_delivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "production_delivery_item" ADD CONSTRAINT "production_delivery_item_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "production_delivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "production_delivery_item" ADD CONSTRAINT "production_delivery_item_productionItemId_fkey" FOREIGN KEY ("productionItemId") REFERENCES "production_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
