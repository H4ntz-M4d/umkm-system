-- READY_STOCK dan MADE_TO_ORDER digabung menjadi REGULAR.
--
-- Keduanya dulu membedakan saluran jual (kasir vs online), bukan produknya,
-- sehingga admin terpaksa membuat produk kembar untuk barang yang sama.
-- PRE_ORDER dipertahankan karena punya aturan sendiri (kuota, tanggal berakhir).
--
-- Cast langsung `"type"::text::"ProductType_new"` hasil prisma migrate diff
-- sengaja TIDAK dipakai: nilai lama READY_STOCK/MADE_TO_ORDER tidak ada di enum
-- baru dan cast-nya akan menggagalkan seluruh migrasi. Pemetaannya ditulis
-- eksplisit di bawah.
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('REGULAR', 'PRE_ORDER');
ALTER TABLE "product_master" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "product_master" ALTER COLUMN "type" TYPE "ProductType_new"
  USING (
    CASE "type"::text
      WHEN 'PRE_ORDER' THEN 'PRE_ORDER'
      ELSE 'REGULAR'
    END
  )::"ProductType_new";
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
ALTER TABLE "product_master" ALTER COLUMN "type" SET DEFAULT 'REGULAR';
COMMIT;

-- reserved_stock dikosongkan untuk dipakai ulang sebagai stok yang DIKUNCI
-- untuk pesanan online (dikunci saat Lunas, dilepas saat Selesai/Batal).
--
-- Isi lamanya bukan alokasi yang masih hidup: kasir dan alur checkout lama
-- menambahnya di setiap penjualan tanpa pernah menguranginya, sehingga
-- nilainya hanya penghitung kumulatif "pernah terjual". Membiarkannya berarti
-- stok yang tampak terkunci sebenarnya tidak dipesan siapa pun.
UPDATE "product_variant_stock" SET "reserved_stock" = 0;
