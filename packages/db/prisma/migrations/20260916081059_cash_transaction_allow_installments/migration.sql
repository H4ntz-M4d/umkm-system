-- DropIndex
DROP INDEX "cash_transaction_referenceId_source_key";

-- CreateIndex
CREATE INDEX "cash_transaction_referenceId_source_idx" ON "cash_transaction"("referenceId", "source");

-- Penjagaan duplikat untuk sumber selain ORDER tetap dipertahankan.
--
-- Hanya pesanan nego yang membayar bertahap (DP lalu pelunasan) dan butuh
-- lebih dari satu baris kas per acuan. POS, pengeluaran, dan produksi tetap
-- satu baris per acuan seperti sebelumnya -- di sanalah constraint ini
-- menahan pencatatan ganda dari percobaan ulang webhook.
--
-- Partial index tidak bisa dideklarasikan lewat skema Prisma, jadi ditulis
-- manual di sini; skema hanya memuat indeks biasanya.
CREATE UNIQUE INDEX "cash_transaction_reference_source_key_non_order"
  ON "cash_transaction"("referenceId", "source")
  WHERE "source" <> 'ORDER';
