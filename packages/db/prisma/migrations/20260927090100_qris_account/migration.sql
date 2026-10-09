-- Data QRIS tercetak milik toko.
--
-- Polanya meniru bank_account: satu baris detail untuk satu metode
-- pembayaran, karena hanya channel tertentu yang memilikinya.

CREATE TABLE "qris_account" (
  "id"              BIGSERIAL NOT NULL,
  "paymentMethodId" BIGINT NOT NULL,
  "merchantName"    VARCHAR(100) NOT NULL,
  "qrImage"         VARCHAR(255) NOT NULL,

  CONSTRAINT "qris_account_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "qris_account_paymentMethodId_key" ON "qris_account"("paymentMethodId");

ALTER TABLE "qris_account"
  ADD CONSTRAINT "qris_account_paymentMethodId_fkey"
  FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
