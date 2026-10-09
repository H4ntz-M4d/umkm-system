-- Channel QRIS tercetak.
--
-- Berdiri sendiri dari migrasi tabelnya karena Postgres tidak mengizinkan
-- nilai enum yang baru ditambahkan dipakai di transaksi yang sama. Dipisah
-- supaya migrasi berikutnya sudah boleh menyebut nilai ini.

ALTER TYPE "PaymentChannel" ADD VALUE 'QRIS_STATIC';
