import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

/**
 * Batas sebuah varian dianggap stoknya rendah. Ditaruh di package schema supaya
 * backend yang menyaring dan frontend yang menuliskan batasnya ke layar tidak
 * bisa berbeda angka.
 */
export const LOW_STOCK_THRESHOLD = 10;

/**
 * Sengaja tidak memakai `reserved_stock`.
 *
 * Di basis kode ini `stock` sudah bersih: penjualan POS dan checkout online
 * sama-sama langsung men-decrement `stock`. Pada operasi yang sama mereka juga
 * men-increment `reserved_stock`, tapi tidak ada satu pun tempat yang
 * mengembalikannya — jadi kolom itu hanya tumbuh terus dan berperilaku sebagai
 * penghitung kumulatif "pernah terjual", bukan alokasi yang masih hidup.
 * Mengurangkannya dari `stock` berarti menghitung penjualan dua kali dan
 * menghasilkan sisa negatif.
 */
export const LowStockProductType = z.enum([
  "MADE_TO_ORDER",
  "PRE_ORDER",
  "READY_STOCK",
]);

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
   * untuk READY_STOCK. Produk made-to-order dibuat saat dipesan, dan pre-order
   * punya kuota sendiri, jadi keduanya tidak menuntut tindakan yang sama.
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
