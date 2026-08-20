-- Distribusi stok antar lokasi.
--
-- Menambahkan penanda rumah produksi pada toko, dan tabel perpindahan stok yang
-- dicatat dua tahap (dikirim, lalu diterima).

-- 1. Penanda rumah produksi
ALTER TABLE "store" ADD COLUMN "isProductionHouse" BOOLEAN NOT NULL DEFAULT false;

-- 2. Toko yang selama ini menampung seluruh stok ditandai sebagai rumah
--    produksi. Memakai penanda sumber online sebagai acuan karena sampai hari
--    ini keduanya memang toko yang sama — bukan karena keduanya sinonim.
UPDATE "store" SET "isProductionHouse" = true
WHERE "id" = (
  SELECT "id" FROM "store"
  WHERE "isActive" = true AND "isOnlineSource" = true
  ORDER BY "id" ASC LIMIT 1
);

-- 3. Untuk sekarang hanya boleh ada tepat satu rumah produksi, ditegakkan
--    database seperti halnya sumber online.
CREATE UNIQUE INDEX "store_single_production_house"
  ON "store" ((true)) WHERE "isProductionHouse";

-- 4. Sumber ledger baru untuk perpindahan antar lokasi
ALTER TYPE "LedgerSource" ADD VALUE 'TRANSFER';

-- 5. Status perpindahan
CREATE TYPE "TransferStatus" AS ENUM ('READY', 'SENT', 'RECEIVED', 'CANCELLED');

-- 6. Tabel perpindahan
CREATE TABLE "stock_transfer" (
  "id"           BIGSERIAL       NOT NULL,
  "code"         VARCHAR(100)    NOT NULL,
  "status"       "TransferStatus" NOT NULL DEFAULT 'READY',
  "fromStoreId"  BIGINT          NOT NULL,
  "toStoreId"    BIGINT          NOT NULL,
  "productionId" BIGINT,
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt"       TIMESTAMP(3),
  "receivedAt"   TIMESTAMP(3),

  CONSTRAINT "stock_transfer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_transfer_code_key" ON "stock_transfer"("code");

-- Satu produksi hanya boleh melahirkan satu kiriman, sehingga penyelesaian yang
-- terpanggil dua kali tidak menghasilkan kiriman kembar.
CREATE UNIQUE INDEX "stock_transfer_productionId_key" ON "stock_transfer"("productionId");

CREATE INDEX "stock_transfer_status_idx" ON "stock_transfer"("status");
CREATE INDEX "stock_transfer_fromStoreId_idx" ON "stock_transfer"("fromStoreId");
CREATE INDEX "stock_transfer_toStoreId_idx" ON "stock_transfer"("toStoreId");

CREATE TABLE "stock_transfer_item" (
  "id"               BIGSERIAL NOT NULL,
  "transferId"       BIGINT    NOT NULL,
  "productVariantId" BIGINT    NOT NULL,
  "quantity"         INTEGER   NOT NULL,

  CONSTRAINT "stock_transfer_item_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stock_transfer_item_transferId_productVariantId_key"
  ON "stock_transfer_item"("transferId", "productVariantId");

ALTER TABLE "stock_transfer"
  ADD CONSTRAINT "stock_transfer_fromStoreId_fkey"
  FOREIGN KEY ("fromStoreId") REFERENCES "store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_transfer"
  ADD CONSTRAINT "stock_transfer_toStoreId_fkey"
  FOREIGN KEY ("toStoreId") REFERENCES "store"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_transfer"
  ADD CONSTRAINT "stock_transfer_productionId_fkey"
  FOREIGN KEY ("productionId") REFERENCES "production"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Item ikut terhapus bersama kirimannya: item tanpa induk tidak berarti apa-apa.
ALTER TABLE "stock_transfer_item"
  ADD CONSTRAINT "stock_transfer_item_transferId_fkey"
  FOREIGN KEY ("transferId") REFERENCES "stock_transfer"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_item"
  ADD CONSTRAINT "stock_transfer_item_productVariantId_fkey"
  FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
