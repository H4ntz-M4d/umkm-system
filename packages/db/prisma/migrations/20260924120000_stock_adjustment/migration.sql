-- Penyesuaian stok.
--
-- Sebelum ini, stok hanya bisa berubah sebagai akibat kejadian lain: produksi,
-- penjualan, atau kiriman antar toko. Tidak ada cara menetapkan stok yang
-- sudah ada saat sistem mulai dipakai, dan tidak ada cara membetulkan angka
-- ketika barang rusak, hilang, atau salah hitung.
--
-- Alasan dan pencatat disimpan di tabel ini, bukan di inventory_ledger, supaya
-- tabel riwayat tetap seragam untuk semua sumber. Barisnya di riwayat memakai
-- source 'ADJUSTMENT' dengan referenceId menunjuk ke sini.

CREATE TABLE "stock_adjustment" (
  "id"        BIGSERIAL NOT NULL,
  "code"      VARCHAR(100) NOT NULL,
  "storeId"   BIGINT NOT NULL,
  "reason"    TEXT NOT NULL,
  "userId"    BIGINT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stock_adjustment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_adjustment_code_key" ON "stock_adjustment"("code");
CREATE INDEX "stock_adjustment_storeId_idx" ON "stock_adjustment"("storeId");

ALTER TABLE "stock_adjustment"
  ADD CONSTRAINT "stock_adjustment_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_adjustment"
  ADD CONSTRAINT "stock_adjustment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "stock_adjustment_item" (
  "id"               BIGSERIAL NOT NULL,
  "adjustmentId"     BIGINT NOT NULL,
  "productVariantId" BIGINT NOT NULL,
  "previousStock"    INTEGER NOT NULL,
  "countedStock"     INTEGER NOT NULL,

  CONSTRAINT "stock_adjustment_item_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_adjustment_item_adjustmentId_productVariantId_key"
  ON "stock_adjustment_item"("adjustmentId", "productVariantId");

ALTER TABLE "stock_adjustment_item"
  ADD CONSTRAINT "stock_adjustment_item_adjustmentId_fkey"
  FOREIGN KEY ("adjustmentId") REFERENCES "stock_adjustment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_adjustment_item"
  ADD CONSTRAINT "stock_adjustment_item_productVariantId_fkey"
  FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
