-- Memindahkan gambar produk dari kolom product_variant.image ke Image Group,
-- yaitu grup yang diidentifikasi oleh kombinasi nilai variant yang bersifat visual.
--
-- URUTAN PENTING: kolom lama product_variant.image baru boleh di-DROP setelah
-- backfill selesai. Prisma menaruh DROP itu di awal; di berkas ini sengaja
-- dipindah ke paling akhir.

-- ============================================================================
-- 0. Jaring pengaman. Hapus manual setelah yakin migrasi benar:
--    DROP TABLE "product_variant_image_backup_20260726";
-- ============================================================================
CREATE TABLE "product_variant_image_backup_20260726" AS
SELECT "id" AS "productVariantId", "productMasterId", "image"
FROM "product_variant"
WHERE "image" IS NOT NULL AND "image" <> '';

-- ============================================================================
-- 1. Bagian aditif
-- ============================================================================
ALTER TABLE "product_variant_type" ADD COLUMN "isHaveVisual" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "product_image_group" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "signature" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_image_group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_image_group_value" (
    "imageGroupId" BIGINT NOT NULL,
    "variantValueId" BIGINT NOT NULL,

    CONSTRAINT "product_image_group_value_pkey" PRIMARY KEY ("imageGroupId","variantValueId")
);

CREATE INDEX "product_image_group_productMasterId_idx" ON "product_image_group"("productMasterId");
CREATE UNIQUE INDEX "product_image_group_productMasterId_signature_key" ON "product_image_group"("productMasterId", "signature");
CREATE INDEX "product_image_group_value_variantValueId_idx" ON "product_image_group_value"("variantValueId");

ALTER TABLE "product_image_group" ADD CONSTRAINT "product_image_group_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_image_group_value" ADD CONSTRAINT "product_image_group_value_imageGroupId_fkey" FOREIGN KEY ("imageGroupId") REFERENCES "product_image_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_image_group_value" ADD CONSTRAINT "product_image_group_value_variantValueId_fkey" FOREIGN KEY ("variantValueId") REFERENCES "product_variant_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_variant" ADD COLUMN "imageGroupId" BIGINT;
CREATE INDEX "product_variant_imageGroupId_idx" ON "product_variant"("imageGroupId");
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_imageGroupId_fkey" FOREIGN KEY ("imageGroupId") REFERENCES "product_image_group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 2. Bangun ulang product_image, tabel yang selama ini ada tapi tidak dipakai.
--    DELETE dulu supaya ADD COLUMN NOT NULL tidak gagal di environment yang
--    ternyata punya baris nyasar.
-- ============================================================================
DELETE FROM "product_image";

ALTER TABLE "product_image" DROP CONSTRAINT IF EXISTS "product_image_productMasterId_fkey";
ALTER TABLE "product_image" DROP COLUMN "productMasterId";
ALTER TABLE "product_image" ADD COLUMN "imageGroupId" BIGINT NOT NULL;
ALTER TABLE "product_image" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "product_image" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "product_image" ALTER COLUMN "image" SET DATA TYPE VARCHAR(500);

CREATE INDEX "product_image_imageGroupId_sortOrder_idx" ON "product_image"("imageGroupId", "sortOrder");
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_imageGroupId_fkey" FOREIGN KEY ("imageGroupId") REFERENCES "product_image_group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 3. Backfill
--
-- Semua tipe lama otomatis isHaveVisual = false, jadi setiap produk lama
-- mengerucut ke satu grup level produk bersignature '[]'. Variant satu produk
-- bisa memegang URL berbeda, maka SEMUA URL unik diselamatkan sebagai baris
-- ProductImage terurut menurut id variant terkecil.
--
-- Konsekuensi yang diterima: UI membaca images[0], jadi produk yang dulu punya
-- 2 foto hanya menampilkan satu sampai admin menandai tipe visual dan mengunggah
-- ulang. Sisanya tersimpan tapi dorman.
-- ============================================================================

-- 3a. satu grup '[]' per master yang memang punya gambar
INSERT INTO "product_image_group" ("productMasterId", "signature")
SELECT DISTINCT "productMasterId", '[]'
FROM "product_variant"
WHERE "image" IS NOT NULL AND "image" <> '';

-- 3b. tiap URL unik jadi satu baris gambar
INSERT INTO "product_image" ("imageGroupId", "image", "sortOrder")
SELECT g."id", s."image", (s."rn" - 1)::int
FROM (
  SELECT pv."productMasterId",
         pv."image",
         ROW_NUMBER() OVER (
           PARTITION BY pv."productMasterId" ORDER BY MIN(pv."id")
         ) AS rn
  FROM "product_variant" pv
  WHERE pv."image" IS NOT NULL AND pv."image" <> ''
  GROUP BY pv."productMasterId", pv."image"
) s
JOIN "product_image_group" g
  ON g."productMasterId" = s."productMasterId" AND g."signature" = '[]';

-- 3c. SEMUA variant master tsb menunjuk ke grup itu, termasuk yang tanpa gambar
UPDATE "product_variant" pv
SET "imageGroupId" = g."id"
FROM "product_image_group" g
WHERE g."productMasterId" = pv."productMasterId" AND g."signature" = '[]';

-- Sengaja tidak ada baris product_image_group_value: grup '[]' memang bernilai
-- kosong. Junction akan terisi sendiri saat produk pertama kali disimpan ulang.

-- ============================================================================
-- 4. Baru sekarang kolom lama boleh dibuang
-- ============================================================================
ALTER TABLE "product_variant" DROP COLUMN "image";
