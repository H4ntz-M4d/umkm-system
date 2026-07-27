import type { z, ProductTypeEnum } from "@repo/schemas";

type ProductType = z.infer<typeof ProductTypeEnum>;

/// Label tipe produk untuk badge kartu. READY_STOCK tidak diberi badge karena
/// itu kondisi normal dan badge-nya cuma jadi noise.
export function productTypeBadge(type: ProductType): string | null {
  switch (type) {
    case "PRE_ORDER":
      return "Pre-Order";
    case "MADE_TO_ORDER":
      return "Made to Order";
    default:
      return null;
  }
}

/**
 * Hanya produk READY_STOCK yang bisa "habis". PRE_ORDER dan MADE_TO_ORDER
 * memang wajar berstok 0 karena dibuat setelah dipesan — keduanya tetap bisa
 * dibeli.
 */
export function isOutOfStock(type: ProductType, stock: number): boolean {
  return type === "READY_STOCK" && stock <= 0;
}
