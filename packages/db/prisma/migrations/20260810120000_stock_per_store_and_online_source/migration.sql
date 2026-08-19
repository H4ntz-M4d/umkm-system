-- Stok dipegang per toko, dan toko sumber penjualan online ditandai eksplisit.
--
-- Backfill-nya sengaja memakai aturan yang selama ini dipakai checkout online
-- secara implisit (`findFirst` toko aktif, urut id menaik), supaya perilaku
-- setelah migrasi persis sama dengan sebelumnya — hanya saja sekarang aturannya
-- tertulis sebagai data, bukan tersembunyi sebagai urutan pembuatan toko.

-- 1. Penanda sumber online pada toko
ALTER TABLE "store" ADD COLUMN "isOnlineSource" BOOLEAN NOT NULL DEFAULT false;

-- 2. Kolom toko pada stok, nullable dulu agar bisa diisi
ALTER TABLE "product_variant_stock" ADD COLUMN "storeId" BIGINT;

-- 3. Seluruh stok yang ada sekarang diberikan ke toko aktif pertama
UPDATE "product_variant_stock"
SET "storeId" = (
  SELECT "id" FROM "store" WHERE "isActive" = true ORDER BY "id" ASC LIMIT 1
);

-- 4. Kalau tidak ada toko aktif, langkah 3 menghasilkan NULL dan perintah ini
--    gagal. Itu disengaja: lebih baik migrasi berhenti keras daripada
--    meninggalkan baris stok tanpa pemilik.
ALTER TABLE "product_variant_stock" ALTER COLUMN "storeId" SET NOT NULL;

-- 5. Keunikan pindah dari "satu baris per varian" menjadi "satu baris per
--    varian per toko"
DROP INDEX "product_variant_stock_productVariantId_key";

CREATE UNIQUE INDEX "product_variant_stock_productVariantId_storeId_key"
  ON "product_variant_stock"("productVariantId", "storeId");

CREATE INDEX "product_variant_stock_storeId_idx"
  ON "product_variant_stock"("storeId");

ALTER TABLE "product_variant_stock"
  ADD CONSTRAINT "product_variant_stock_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. Toko yang sama ditandai sebagai sumber penjualan online
UPDATE "store" SET "isOnlineSource" = true
WHERE "id" = (
  SELECT "id" FROM "store" WHERE "isActive" = true ORDER BY "id" ASC LIMIT 1
);

-- 7. Untuk sekarang hanya boleh ada tepat satu toko sumber online. Ditegakkan
--    di database, bukan hanya di aplikasi, supaya tidak bisa dilanggar lewat
--    jalur lain — seed, perbaikan manual, atau skrip.
--    Indeks parsial pada ekspresi konstan: seluruh baris ber-`isOnlineSource`
--    true memakai kunci yang sama, sehingga baris kedua langsung ditolak.
CREATE UNIQUE INDEX "store_single_online_source"
  ON "store" ((true)) WHERE "isOnlineSource";
