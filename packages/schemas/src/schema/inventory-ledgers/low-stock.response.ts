import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

/**
 * Batas sebuah varian dianggap stoknya rendah. Ditaruh di package schema supaya
 * backend yang menyaring dan frontend yang menuliskan batasnya ke layar tidak
 * bisa berbeda angka.
 */
export const LOW_STOCK_THRESHOLD = 10;

/**
 * Dasar hitungnya `stock`, bukan `stock - reserved_stock`.
 *
 * `stock` adalah stok BEBAS: penjualan kasir mengurangi langsung, dan pesanan
 * online yang dikunci saat Lunas juga memindahkannya keluar dari `stock` ke
 * `reserved_stock`. Mengurangkan `reserved_stock` lagi berarti menghitung stok
 * terkunci dua kali.
 */
export const LowStockProductType = z.enum(["REGULAR", "PRE_ORDER"]);

export const LowStockData = z.object({
  variantId: z.string(),
  productId: z.string(),
  /**
   * Stok dipegang per toko, jadi satu varian bisa muncul lebih dari sekali —
   * menipis di satu cabang sementara aman di cabang lain. Tanpa menyebut
   * tokonya, dua baris dengan produk dan SKU sama akan terbaca sebagai
   * duplikat yang membingungkan.
   */
  storeId: z.string(),
  storeName: z.string(),
  productName: z.string(),
  /**
   * Ikut dikirim karena stok rendah hanya benar-benar berarti "perlu restock"
   * untuk REGULAR. Pre-order punya kuota sendiri, jadi keduanya tidak menuntut
   * tindakan yang sama.
   */
  type: LowStockProductType,
  sku: z.string(),
  /// Gabungan nilai varian, misalnya "Merah / L". Kosong untuk produk tanpa varian.
  variantLabel: z.string(),
  stock: z.number(),
  updatedAt: z.string(),
});

export const LowStockResponse = ApiSuccessResponse(z.array(LowStockData));

export type LowStockDataType = z.infer<typeof LowStockData>;
