-- Admin yang memproses pesanan online (mencatat hasil nego, menutup pesanan).
-- Nullable: pesanan lama tidak punya jejak siapa yang menanganinya.
ALTER TABLE "order" ADD COLUMN "userId" BIGINT;

-- SET NULL, bukan CASCADE: menghapus akun karyawan tidak boleh ikut menghapus
-- pesanannya, karena angkanya sudah masuk laporan.
ALTER TABLE "order" ADD CONSTRAINT "order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "order_userId_idx" ON "order"("userId");
