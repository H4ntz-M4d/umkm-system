import type { z, ProductTypeEnum } from "@repo/schemas";

type ProductType = z.infer<typeof ProductTypeEnum>;

/**
 * Label tipe produk untuk badge kartu.
 *
 * Hanya PRE_ORDER yang diberi badge. Semua produk online memang dibuat setelah
 * dipesan, jadi badge untuk produk Reguler akan menempel di setiap kartu dan
 * cuma jadi noise.
 *
 * Tidak ada lagi pengecekan "stok habis" untuk storefront: stok fisik hanya
 * dijual lewat kasir. Satu-satunya "habis" di storefront adalah kuota
 * pre-order — lihat `isPreOrderSoldOut`.
 */
export function productTypeBadge(type: ProductType): string | null {
  return type === "PRE_ORDER" ? "Pre-Order" : null;
}

/**
 * Sisa kuota pre-order, atau `null` kalau produknya bukan PRE_ORDER (supaya
 * pemanggil bisa membedakan "bukan PRE_ORDER" dari "kuotanya nol").
 *
 * Baris `ProductPreOrderDetails` yang kosong (`null`/`undefined`) diperlakukan
 * sama dengan kuota nol — tidak ada yang bisa dipesan kalau datanya sendiri
 * tidak ada, bukan malah dianggap tidak terbatas.
 */
export function preOrderQuotaRemaining(product: {
  type: ProductType;
  productPreOrderDetail?: { maxQuota: number } | null;
}): number | null {
  if (product.type !== "PRE_ORDER") return null;
  return product.productPreOrderDetail?.maxQuota ?? 0;
}

/// PRE_ORDER yang kuotanya sudah habis diambil pesanan lain (atau baris
/// kuotanya sendiri tidak ada di database) — sama-sama berarti tidak bisa
/// dipesan lagi, walau stok fisiknya memang selalu 0 untuk tipe ini.
export function isPreOrderSoldOut(product: {
  type: ProductType;
  productPreOrderDetail?: { maxQuota: number } | null;
}): boolean {
  const remaining = preOrderQuotaRemaining(product);
  return remaining !== null && remaining <= 0;
}
