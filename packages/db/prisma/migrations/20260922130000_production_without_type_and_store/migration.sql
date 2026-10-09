-- Produksi berhenti menyebut "tipe" dan "toko tujuan".
--
-- Tipe dibuang karena satu batch produksi bisa memuat barang untuk stok,
-- untuk pesanan yang sudah masuk, maupun untuk pre-order sekaligus -- satu
-- label per batch tidak pernah benar.
--
-- Toko tujuan dibuang karena hasil produksi SELALU mendarat di rumah
-- produksi. Cabang Nurfa Craft berdiri sendiri dan melakukan restock dengan
-- membeli ke toko utama, jadi tidak ada lagi "produksi untuk toko lain",
-- dan kiriman otomatis dari produksi ikut dihapus.

-- Kiriman yang dulu lahir otomatis dari produksi kehilangan tautannya.
-- Barisnya sendiri dipertahankan: itu riwayat perpindahan stok yang nyata.
ALTER TABLE "stock_transfer" DROP CONSTRAINT IF EXISTS "stock_transfer_productionId_fkey";
DROP INDEX IF EXISTS "stock_transfer_productionId_key";
ALTER TABLE "stock_transfer" DROP COLUMN "productionId";

ALTER TABLE "production" DROP CONSTRAINT IF EXISTS "production_storeId_fkey";
ALTER TABLE "production" DROP COLUMN "storeId";
ALTER TABLE "production" DROP COLUMN "type";

DROP TYPE "ProductionType";
