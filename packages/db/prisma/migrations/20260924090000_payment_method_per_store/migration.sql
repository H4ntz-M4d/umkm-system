-- Metode pembayaran jadi milik satu toko.
--
-- Sebelumnya semua metode global, sehingga kasir cabang ikut melihat rekening
-- dan QRIS toko utama. Cabang berdiri sendiri, jadi uangnya harus masuk ke
-- rekening mereka sendiri.
--
-- Kolomnya boleh kosong: kosong berarti "berlaku di semua toko", yang dipakai
-- untuk pembayaran tunai.

ALTER TABLE "payment_method" ADD COLUMN "storeId" BIGINT;

ALTER TABLE "payment_method"
  ADD CONSTRAINT "payment_method_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "store"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "payment_method_storeId_idx" ON "payment_method"("storeId");

-- Isi awal sesuai keadaan sebenarnya: rekening bank dan QRIS yang ada hari ini
-- milik toko utama (penanda `isOnlineSource`), sedangkan tunai dibiarkan
-- kosong supaya tetap bisa dipakai semua toko.
--
-- Transaksi lama tidak disentuh sama sekali: baris pos_transaction dan "order"
-- tetap menunjuk metode yang sama, jadi riwayat dan laporan tidak berubah.
UPDATE "payment_method"
SET "storeId" = (
  SELECT "id" FROM "store" WHERE "isOnlineSource" = true ORDER BY "id" ASC LIMIT 1
)
WHERE "channel" <> 'CASH';
