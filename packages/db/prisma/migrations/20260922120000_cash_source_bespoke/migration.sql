-- Sumber kas baru untuk pesanan custom.
--
-- Ditulis di migrasi TERSENDIRI, bukan digabung dengan pemindahan datanya:
-- PostgreSQL tidak mengizinkan nilai enum yang baru ditambahkan langsung
-- dipakai di transaksi yang sama.
ALTER TYPE "CashSource" ADD VALUE 'BESPOKE';
