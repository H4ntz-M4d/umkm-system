-- Penanda stok pesanan online sudah dikunci saat Lunas. Pesanan lama tetap
-- NULL: aturan kunci stok hanya berlaku untuk pesanan yang dilunasi sesudahnya.
ALTER TABLE "order" ADD COLUMN "stockLockedAt" TIMESTAMP(3);
