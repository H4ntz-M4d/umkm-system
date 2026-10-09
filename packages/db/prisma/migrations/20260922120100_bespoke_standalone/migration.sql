-- Pesanan custom (dulu "tipe produksi BE_SPOKE") berdiri sendiri.
--
-- Alurnya memang berbeda dari produksi: tidak pernah menyentuh stok, dan
-- justru mencatat kas MASUK saat selesai. Menempelkannya pada Production
-- memaksa tiga percabangan khusus di service dan membuat batch produksi
-- seolah-olah punya satu "tipe".

CREATE TYPE "BespokeStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Tabel lamanya dipertahankan (beserta isinya dan relasi ke customer/shipment),
-- hanya berganti nama dan berhenti menempel ke produksi.
ALTER TABLE "be_spoke_details" RENAME TO "bespoke_order";

ALTER TABLE "bespoke_order" ADD COLUMN "code" VARCHAR(100);
ALTER TABLE "bespoke_order" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "bespoke_order" ADD COLUMN "status" "BespokeStatus" NOT NULL DEFAULT 'PLANNED';
ALTER TABLE "bespoke_order" ADD COLUMN "targetDate" TIMESTAMP(3);
ALTER TABLE "bespoke_order" ADD COLUMN "notes" TEXT;
ALTER TABLE "bespoke_order" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Pindahkan keadaan pengerjaan dari baris produksinya.
UPDATE "bespoke_order" b
SET "status"      = p."status"::text::"BespokeStatus",
    "quantity"    = GREATEST(p."quantityProduced", 1),
    "targetDate"  = p."targetDate",
    "notes"       = p."notes",
    "completedAt" = CASE WHEN p."status" = 'COMPLETED' THEN p."createdAt" END
FROM "production" p
WHERE b."productionId" = p."id";

-- Nomor pesanan custom. Mengikuti pola kode transaksi lain (PREFIX-tanggal-acak).
UPDATE "bespoke_order"
SET "code" = 'BSP-' || to_char("createdAt", 'YYYYMMDD') || '-' || lpad("id"::text, 4, '0')
WHERE "code" IS NULL;

-- Baris yang sempat kehilangan induknya tetap perlu tanggal target.
UPDATE "bespoke_order" SET "targetDate" = "createdAt" WHERE "targetDate" IS NULL;

ALTER TABLE "bespoke_order" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "bespoke_order" ALTER COLUMN "targetDate" SET NOT NULL;
CREATE UNIQUE INDEX "bespoke_order_code_key" ON "bespoke_order"("code");
CREATE INDEX "bespoke_order_customerId_idx" ON "bespoke_order"("customerId");

-- Kas masuk pesanan custom berhenti menyamar sebagai mutasi produksi, dan
-- acuannya diarahkan ke baris pesanannya sendiri.
UPDATE "cash_transaction" c
SET "source" = 'BESPOKE', "referenceId" = b."id"
FROM "bespoke_order" b
WHERE c."source" = 'PRODUCTION' AND c."referenceId" = b."productionId";

-- Tautan ke produksi diputus DULU, baru baris produksinya dihapus: selama
-- foreign key-nya masih ada, penghapusan ditolak.
ALTER TABLE "bespoke_order" DROP CONSTRAINT IF EXISTS "be_spoke_details_productionId_fkey";
DROP INDEX IF EXISTS "be_spoke_details_productionId_key";
ALTER TABLE "bespoke_order" DROP COLUMN "productionId";

-- Baris produksi yang selama ini cuma jadi cangkang pesanan custom.
DELETE FROM "production" WHERE "type" = 'BE_SPOKE';

-- Nama kolom pada shipment ikut menyesuaikan.
ALTER TABLE "shipment" RENAME COLUMN "beSpokeDetailsId" TO "bespokeOrderId";

-- BE_SPOKE tidak lagi dipakai sebagai tipe produksi.
ALTER TYPE "ProductionType" RENAME TO "ProductionType_old";
CREATE TYPE "ProductionType" AS ENUM ('RESTOCK', 'MADE_TO_ORDER', 'PRE_ORDER');
ALTER TABLE "production" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "production" ALTER COLUMN "type" TYPE "ProductionType" USING ("type"::text::"ProductionType");
ALTER TABLE "production" ALTER COLUMN "type" SET DEFAULT 'RESTOCK';
DROP TYPE "ProductionType_old";
