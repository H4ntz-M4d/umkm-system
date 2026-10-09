-- Admin yang menginput pengeluaran. Diambil dari token, bukan dari form,
-- supaya tidak bisa diisi atas nama orang lain.
-- Nullable: data lama tidak punya jejak siapa yang menginput.
ALTER TABLE "expense" ADD COLUMN "userId" BIGINT;

-- SET NULL, bukan CASCADE: menghapus akun karyawan tidak boleh ikut menghapus
-- pengeluarannya, karena angkanya sudah masuk laporan.
ALTER TABLE "expense" ADD CONSTRAINT "expense_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "expense_userId_idx" ON "expense"("userId");
