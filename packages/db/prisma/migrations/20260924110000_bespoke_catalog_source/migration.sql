-- Asal desain pesanan custom.
--
-- Pesanan yang desainnya sudah ada di katalog boleh berapa pun jumlahnya —
-- termasuk yang cuma minta ganti warna, karena polanya sudah dipunya. Desain
-- di luar katalog harus dibuat polanya dari nol, jadi ada jumlah minimum;
-- aturannya dipegang aplikasi, bukan database, supaya angkanya bisa diubah
-- tanpa migrasi baru.
--
-- Kolomnya boleh kosong, dan pesanan lama memang dibiarkan kosong: data lama
-- tidak dipaksa masuk ke salah satu kategori dengan tebakan.

ALTER TABLE "bespoke_order" ADD COLUMN "productMasterId" BIGINT;

ALTER TABLE "bespoke_order"
  ADD CONSTRAINT "bespoke_order_productMasterId_fkey"
  FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "bespoke_order_productMasterId_idx" ON "bespoke_order"("productMasterId");
