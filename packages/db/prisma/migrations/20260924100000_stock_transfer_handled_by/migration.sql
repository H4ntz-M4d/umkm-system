-- Penanggung jawab kiriman stok.
--
-- Sebelumnya kiriman tidak menyimpan siapa yang mengurusnya, jadi saat ada
-- selisih barang tidak ada jejak siapa yang bisa ditanya.
--
-- Kolomnya boleh kosong: kiriman lama tidak diisi dengan tebakan.

ALTER TABLE "stock_transfer" ADD COLUMN "userId" BIGINT;

ALTER TABLE "stock_transfer"
  ADD CONSTRAINT "stock_transfer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "stock_transfer_userId_idx" ON "stock_transfer"("userId");
