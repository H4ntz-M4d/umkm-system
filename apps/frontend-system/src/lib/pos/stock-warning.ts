import { toast } from "sonner";
import type { PosStockWarningDataType } from "@repo/schemas";

/**
 * Peringatan untuk varian yang stoknya jadi minus setelah pembayaran QRIS atau
 * transfer dicatat.
 *
 * Uangnya sudah diterima, jadi transaksi tetap Lunas — stok minus menandakan
 * angka di sistem yang keliru (barangnya secara fisik ada di meja kasir),
 * bukan barang yang tidak ada. Kasir diminta mengecek stok fisiknya.
 */
export function notifyPosStockWarnings(warnings: PosStockWarningDataType[]) {
  if (warnings.length === 0) return;

  toast.warning("Stok di sistem jadi minus — cek stok fisik", {
    position: "top-center",
    duration: 10_000,
    description: warnings
      .map((item) => `${item.productName} (${item.sku}): ${item.stock}`)
      .join(", "),
  });
}
