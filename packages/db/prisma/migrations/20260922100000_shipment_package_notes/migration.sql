-- Catatan admin soal paket. Seperti "shippingCost": murni keterangan, tidak
-- menambah tagihan customer dan tidak dicatat di kas.
-- Berat disimpan apa adanya karena satuannya ikut diketik admin ("15 Kg").
ALTER TABLE "shipment" ADD COLUMN "totalWeight" VARCHAR(50);
ALTER TABLE "shipment" ADD COLUMN "unitWeight" VARCHAR(50);

-- Harga per satuan disimpan sebagai angka supaya bisa dijumlah dan dibandingkan.
ALTER TABLE "shipment" ADD COLUMN "unitPrice" DECIMAL(18,2);
