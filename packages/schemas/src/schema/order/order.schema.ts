import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

/**
 * Urutannya mengikuti `enum OrderStatus` di schema.prisma.
 *
 * `PENDING` sekarang berarti "Mengajukan" — pesanan sudah masuk tapi belum
 * dinego. Nilainya sengaja tidak diganti nama karena kode Midtrans lama
 * (yang dinonaktifkan, bukan dihapus) masih membacanya sebagai "menunggu
 * pembayaran". Labelnya saja yang diterjemahkan di sisi tampilan.
 */
export const OrderStatus = z.enum([
  "PENDING",
  /// DP sudah dibayar sebagian, belum lunas.
  "DP",
  /// Barang selesai diproduksi, tapi belum tentu lunas -- memicu WA yang
  /// meminta customer menyelesaikan pelunasan.
  "PRODUCTION_DONE",
  "PAID",
  "CANCELLED",
  "SHIPPED",
  "COMPLETED",
  "REFUNDED",
]);

export type OrderStatusInput = z.infer<typeof OrderStatus>;

/// Pesanan dikirim ke alamat, atau diambil sendiri di rumah produksi.
export const OrderDeliveryMethod = z.enum(["SHIP", "PICKUP"]);

export type OrderDeliveryMethodInput = z.infer<typeof OrderDeliveryMethod>;

export const ShipmentStatus = z.enum([
  "PACKAGING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export type ShipmentStatusInput = z.infer<typeof ShipmentStatus>;

/// Status yang boleh DIPILIH admin. `CANCELLED` tetap ada di `ShipmentStatus`
/// karena data pengiriman lama bisa berstatus itu, tapi pengiriman tidak lagi
/// dibatalkan dari sheet — pesanannya yang dibatalkan, lewat dialog pesanan.
export const ShipmentUpdateStatus = z.enum(["PACKAGING", "SHIPPED", "DELIVERED"]);

export type ShipmentUpdateStatusInput = z.infer<typeof ShipmentUpdateStatus>;

export const UpdateShipmentSchema = z.object({
  status: ShipmentUpdateStatus,
  trackingNumber: z.string().max(100).optional().nullable(),
  /**
   * Ongkir yang dibayarkan ke kurir, diisi admin setelah paketnya ditimbang.
   *
   * Untuk sekarang MURNI CATATAN: tidak menambah tagihan customer dan tidak
   * menyentuh kas, karena harga yang berlaku adalah hasil nego di WhatsApp
   * dan belum diputuskan apakah ongkir sudah termasuk di dalamnya.
   */
  shippingCost: z
    .number()
    .nonnegative("Ongkir tidak boleh negatif")
    .optional(),
  /**
   * Catatan paket untuk admin: berat total, berat per satuan, dan harga per
   * satuan. Sama seperti ongkir — tidak menambah tagihan dan tidak menyentuh
   * kas — dan tidak ditampilkan ke customer.
   *
   * Berat berupa teks karena satuannya ikut diketik admin ("15 Kg", "1,5
   * Kg/pcs"); harga per satuan berupa angka supaya bisa dihitung.
   */
  totalWeight: z.string().max(50).optional().nullable(),
  unitWeight: z.string().max(50).optional().nullable(),
  unitPrice: z
    .number()
    .nonnegative("Harga per satuan tidak boleh negatif")
    .optional()
    .nullable(),
});

export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;

export const OrderItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number(),
  price: z.number(),
  /// Permintaan custom dari customer untuk item ini (ubah warna, motif, dll).
  notes: z.string().optional().nullable(),
});

export const OrderShipmentSchema = z.object({
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  province: z.string(),
  courier: z.string(),
  shippingCost: z.number(),
});

export const OrderSchema = z.object({
  storeId: z.string(),
  customerId: z.string().optional().nullable(),
  orderId: z.string(),
  /// Kosong sampai admin mencatat DP masuk lewat channel mana.
  paymentMethodId: z.string().optional().nullable(),
  status: OrderStatus,
  deliveryMethod: OrderDeliveryMethod,
  /// Akumulasi harga katalog saat pesanan diajukan — referensi, tidak berubah.
  estimatedTotal: z.number(),
  /// Harga yang berlaku: hasil nego, ditimpa manual oleh admin.
  totalAmount: z.number(),
  /// Nominal DP yang sudah masuk, diisi manual oleh admin.
  dpAmount: z.number().optional().nullable(),
  buyerName: z.string().optional().nullable(),
  buyerPhone: z.string().optional().nullable(),
  items: z.array(OrderItemSchema),
  shipment: OrderShipmentSchema.optional().nullable(),
});

export type OrderSchemaInput = z.infer<typeof OrderSchema>;

export const OrderQuerySchema = PaginationSchema.extend({
  store: z.string().optional(),
  status: OrderStatus.optional(),
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;

// ====================== Checkout lama (dinonaktifkan) ========================
//
// Alur bayar online lewat Midtrans sudah tidak dipakai: storefront sekarang
// cuma katalog, pemesanan dilanjutkan lewat WhatsApp (lihat SubmitOrderSchema
// di bawah). `CheckoutSchema` sengaja dibiarkan ada — bukan dihapus — supaya
// alur lama bisa dihidupkan lagi tanpa menulis ulang.

/// Alamat yang diketik langsung di halaman checkout, untuk customer yang belum
/// punya alamat tersimpan. shippingCost sengaja tidak ada di sini — ongkir
/// ditentukan server, bukan dikirim client.
export const CheckoutShipmentSchema = z.object({
  recipientName: z
    .string()
    .min(3, "Nama penerima minimal memiliki panjang 3 karakter"),
  phone: z.string().min(8, "Nomor telepon tidak valid"),
  addressLine: z.string().min(5, "Alamat minimal memiliki panjang 5 karakter"),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
});

/**
 * Isi keranjang sengaja tidak ikut dikirim. Server membacanya sendiri dari
 * CartItem supaya harga dan jumlah tidak bisa dimanipulasi dari client.
 */
export const CheckoutSchema = z
  .object({
    /// Pakai alamat dari buku alamat...
    addressId: z.string().optional(),
    /// ...atau ketik alamat baru. Salah satu wajib ada.
    shipment: CheckoutShipmentSchema.optional(),
    courier: z.string().min(1, "Kurir wajib dipilih"),
    /// Simpan alamat baru ke buku alamat setelah checkout.
    saveAddress: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.addressId) || Boolean(data.shipment), {
    message: "Alamat pengiriman wajib diisi",
    path: ["addressId"],
  });

export type CheckoutInput = z.infer<typeof CheckoutSchema>;

// ========================= Ajukan pesanan (WA) ===============================

export const SubmitOrderItemSchema = z.object({
  productVariantId: z.string().min(1, "Produk wajib dipilih"),
  quantity: z.number().int().positive("Jumlah minimal 1"),
  /// Permintaan custom: ubah warna, motif, ukuran, dan sejenisnya.
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),
});

/**
 * Pengajuan pesanan dari keranjang storefront.
 *
 * Berbeda dengan `CheckoutSchema` lama, isi keranjang WAJIB ikut dikirim:
 * keranjang tamu hanya hidup di localStorage browser dan tidak pernah
 * tersinkron ke server, jadi server tidak punya tempat lain untuk membacanya.
 * Harganya tetap tidak dipercaya dari client — server menghitung ulang sendiri
 * dari `ProductVariant.price`, yang dikirim di sini hanya varian dan jumlahnya.
 *
 * `buyerName`/`buyerPhone` opsional di sini karena schema tidak tahu apakah
 * pengirimnya sudah login. Service yang menegakkan: wajib diisi kalau tidak
 * ada sesi, diambil dari akun kalau ada.
 */
export const SubmitOrderSchema = z
  .object({
    items: z.array(SubmitOrderItemSchema).min(1, "Keranjang masih kosong"),
    deliveryMethod: OrderDeliveryMethod,
    /// Tiga field berikut hanya relevan untuk deliveryMethod "SHIP".
    addressId: z.string().optional(),
    shipment: CheckoutShipmentSchema.optional(),
    courier: z.string().optional(),
    saveAddress: z.boolean().optional(),
    buyerName: z
      .string()
      .min(3, "Nama minimal memiliki panjang 3 karakter")
      .optional(),
    buyerPhone: z.string().min(8, "Nomor WhatsApp tidak valid").optional(),
  })
  .superRefine((data, ctx) => {
    /// Ambil di tempat tidak butuh alamat maupun kurir.
    if (data.deliveryMethod !== "SHIP") return;

    if (!data.addressId && !data.shipment) {
      ctx.addIssue({
        code: "custom",
        message: "Alamat pengiriman wajib diisi",
        path: ["addressId"],
      });
    }

    if (!data.courier) {
      ctx.addIssue({
        code: "custom",
        message: "Kurir wajib dipilih",
        path: ["courier"],
      });
    }
  });

export type SubmitOrderInput = z.infer<typeof SubmitOrderSchema>;
export type SubmitOrderItemInput = z.infer<typeof SubmitOrderItemSchema>;

// ===================== Pencatatan hasil nego (admin) =========================

/**
 * Status yang boleh dituju admin setelah nego.
 *
 * `PENDING` sengaja tidak ada: pesanan yang sudah diproses tidak bisa
 * dikembalikan ke "Mengajukan".
 */
export const OrderNegotiationStatus = z.enum([
  "DP",
  "PRODUCTION_DONE",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
]);

export type OrderNegotiationStatusInput = z.infer<
  typeof OrderNegotiationStatus
>;

/**
 * Status yang boleh dituju dari dialog nego, per status sekarang.
 *
 * Satu sumber untuk server (yang menegakkan) dan dialog admin (yang hanya
 * menawarkan pilihan yang sah). Status yang tidak ada di sini — Selesai,
 * Batal, Refund — sudah final dan tidak bisa diubah lagi.
 *
 * Yang sengaja TIDAK ada di sini:
 *  - Dikirim: hanya lewat sheet pengiriman, dan hanya setelah Lunas.
 *  - Selesai untuk pesanan berkurir: lewat sheet pengiriman (Diterima).
 *    Server menolaknya dari dialog nego; `COMPLETED` di bawah hanya sah
 *    untuk pesanan ambil di tempat.
 */
export const ORDER_NEGOTIATION_TRANSITIONS: Record<
  string,
  OrderNegotiationStatusInput[]
> = {
  PENDING: ["DP", "PRODUCTION_DONE", "PAID", "CANCELLED"],
  DP: ["PRODUCTION_DONE", "PAID", "CANCELLED"],
  PRODUCTION_DONE: ["PAID", "CANCELLED"],
  PAID: ["COMPLETED", "CANCELLED"],
  SHIPPED: ["REFUNDED"],
};

/**
 * Semua field opsional: admin bisa mencatat DP dulu, harganya belakangan,
 * atau sekadar menggeser status.
 *
 * Aturan yang TIDAK bisa ditegakkan di sini karena butuh nilai tersimpan —
 * dikerjakan di service: `dpAmount` tidak boleh melebihi `totalAmount` yang
 * berlaku, dan `SHIPPED` hanya sah untuk pesanan berkurir.
 */
export const UpdateOrderNegotiationSchema = z
  .object({
    /// Harga akhir hasil nego. Bebas, tidak terikat akumulasi harga katalog.
    totalAmount: z
      .number()
      .positive("Total kesepakatan harus lebih dari 0")
      .optional(),
    dpAmount: z
      .number()
      .nonnegative("Nominal DP tidak boleh negatif")
      .optional()
      .nullable(),
    /// Channel tempat DP/pelunasan masuk — opsional, sekadar catatan.
    paymentMethodId: z.string().optional().nullable(),
    status: OrderNegotiationStatus.optional(),
    /// Uang yang dikembalikan ke customer. Hanya dibaca saat Batal (bawaan 0,
    /// artinya DP hangus) dan Refund (bawaan seluruh yang sudah dibayar).
    refundAmount: z
      .number()
      .nonnegative("Nominal pengembalian tidak boleh negatif")
      .optional(),
    /// Refund saja: barangnya kembali dan layak dijual lagi. Kalau tidak,
    /// barangnya dianggap hilang dan dicatat keluar dari stok.
    restock: z.boolean().optional(),
    /**
     * Admin yang menangani pesanan ini.
     *
     * Dipilih di dialog (bawaannya akun yang sedang login), jadi ikut di body
     * — bukan diambil diam-diam dari token. Karena datang dari luar, server
     * tetap memastikan id-nya menunjuk karyawan aktif.
     */
    userId: z.string().regex(/^\d+$/, "Pilihan karyawan tidak valid").optional(),
  })
  .refine(
    (data) =>
      data.totalAmount !== undefined ||
      data.dpAmount !== undefined ||
      data.paymentMethodId !== undefined ||
      data.status !== undefined ||
      /// Ikut dihitung sebagai perubahan: mengganti "Diproses oleh" saja
      /// adalah penyimpanan yang sah, dan tanpa baris ini akan ditolak
      /// dengan galat yang menempel di kolom Total.
      data.userId !== undefined,
    {
      message: "Tidak ada perubahan yang dikirim",
      /// Tanpa path, galatnya menempel di path kosong dan tidak pernah tampil.
      path: ["totalAmount"],
    },
  );

export type UpdateOrderNegotiationInput = z.infer<
  typeof UpdateOrderNegotiationSchema
>;

export const MyOrderQuerySchema = PaginationSchema.extend({
  status: OrderStatus.optional(),
});

export type MyOrderQueryInput = z.infer<typeof MyOrderQuerySchema>;
