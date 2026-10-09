import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import {
  OrderDeliveryMethod,
  OrderStatus,
  ShipmentStatus,
} from "./order.schema";

export const OrderItemData = z.object({
  id: z.coerce.string(),
  productName: z.string(),
  quantity: z.coerce.string(),
  price: z.coerce.string(),
  subtotal: z.coerce.string(),
  /// Permintaan custom dari pembeli — yang jadi bahan nego di WhatsApp.
  notes: z.string().nullable(),
});

export const OrderShipmentData = z.object({
  id: z.coerce.string(),
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  province: z.string(),
  courier: z.string(),
  /// Diisi manual oleh admin; belum ada integrasi kurir.
  trackingNumber: z.string().nullable(),
  status: ShipmentStatus.nullable(),
  shippingCost: z.coerce.string(),
  createdAt: z.union([z.date(), z.string()]).transform((val) => String(val)),
});

/**
 * Bentuk pengiriman untuk sisi ADMIN saja.
 *
 * Tiga catatan paket ini sengaja tidak ada di `OrderShipmentData`, karena
 * bentuk itu dipakai bersama halaman pesanan customer — memisahkannya membuat
 * catatan internal tidak bisa bocor ke customer karena TIPENYA, bukan karena
 * mapper-nya kebetulan tidak memilihnya.
 */
export const AdminOrderShipmentData = OrderShipmentData.extend({
  totalWeight: z.string().nullable().default(null),
  unitWeight: z.string().nullable().default(null),
  unitPrice: z.coerce.string().nullable().default(null),
});

export const OrderData = z.object({
  storeId: z.coerce.string(),
  storeName: z.string(),
  /// Untuk pesanan tamu ini berisi nama yang diisi sendiri saat memesan.
  customerName: z.string(),
  buyerName: z.string().nullable(),
  buyerPhone: z.string().nullable(),
  orderId: z.string(),
  paymentMethodName: z.string(),
  status: z.string(),
  deliveryMethod: OrderDeliveryMethod,
  /// Akumulasi harga katalog saat diajukan — pembanding, bukan harga berlaku.
  estimatedTotal: z.coerce.string(),
  /// Harga hasil kesepakatan; ini yang berlaku.
  totalAmount: z.coerce.string(),
  dpAmount: z.coerce.string().nullable(),
  /// Admin yang memproses pesanan. `.default(null)` menjaga respons lama yang
  /// belum membawa field ini tetap terbaca, bukan gagal parse dan
  /// mengosongkan seluruh tabel.
  processedById: z.coerce.string().nullable().default(null),
  processedByName: z.string().nullable().default(null),
  createdAt: z.union([z.date(), z.string()]).transform((val) => String(val)),
  items: z.array(OrderItemData),
  shipment: AdminOrderShipmentData.nullable(),
});

export type OrderItemDataType = z.infer<typeof OrderItemData>;
export type OrderShipmentDataType = z.infer<typeof OrderShipmentData>;
export type AdminOrderShipmentDataType = z.infer<typeof AdminOrderShipmentData>;
export type OrderDataType = z.infer<typeof OrderData>;

export const OrderResponse = ApiSuccessResponse(z.array(OrderData));

/// Jumlah pesanan yang dibatalkan lewat pembatalan massal.
export const OrderCancelResponse = ApiSuccessResponse(
  z.object({ count: z.number() }),
);

export const UpdateShipmentData = z.object({
  orderId: z.string(),
  shipmentStatus: ShipmentStatus.nullable(),
  trackingNumber: z.string().nullable(),
  /// Ongkir yang tersimpan setelah perubahan ini — catatan, bukan tagihan.
  shippingCost: z.coerce.string().default("0"),
  totalWeight: z.string().nullable().default(null),
  unitWeight: z.string().nullable().default(null),
  unitPrice: z.coerce.string().nullable().default(null),
  /// Status pesanan setelah diselaraskan dengan status pengiriman.
  orderStatus: OrderStatus,
});

export type UpdateShipmentDataType = z.infer<typeof UpdateShipmentData>;

export const UpdateShipmentResponse = ApiSuccessResponse(UpdateShipmentData);

export const UpdateOrderNegotiationData = z.object({
  orderId: z.string(),
  status: OrderStatus,
  totalAmount: z.string(),
  dpAmount: z.string().nullable(),
  /// Dihitung server supaya admin tidak perlu mengurangi sendiri.
  remainingAmount: z.string(),
});

export type UpdateOrderNegotiationDataType = z.infer<
  typeof UpdateOrderNegotiationData
>;

export const UpdateOrderNegotiationResponse = ApiSuccessResponse(
  UpdateOrderNegotiationData,
);

// =========================== Sisi Customer ===================================

/// Alur bayar online lama — dinonaktifkan, tidak dihapus.
export const CheckoutData = z.object({
  orderId: z.string(),
  snapToken: z.string(),
  redirectUrl: z.string(),
  totalAmount: z.string(),
});

export const CheckoutResponse = ApiSuccessResponse(CheckoutData);
export type CheckoutDataType = z.infer<typeof CheckoutData>;

export const SubmitOrderData = z.object({
  orderId: z.string(),
  /// Akumulasi harga katalog — bukan harga final, itu ditentukan lewat nego.
  estimatedTotal: z.string(),
  totalItems: z.number(),
  /// Pesanan tamu tidak tertaut akun, jadi tidak bisa dibuka di /orders.
  isGuest: z.boolean(),
});

export const SubmitOrderResponse = ApiSuccessResponse(SubmitOrderData);
export type SubmitOrderDataType = z.infer<typeof SubmitOrderData>;

/// Lebih kaya dari OrderItemData milik admin: membawa gambar dan slug supaya
/// riwayat pesanan bisa menampilkan produk dan menautkannya kembali.
export const CustomerOrderItemData = z.object({
  id: z.string(),
  productVariantId: z.coerce.string(),
  /// Barangnya masih dijual atau sudah ditarik dari katalog.
  isAvailable: z.boolean().default(true),
  productName: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
  options: z.record(z.string(), z.string()),
  quantity: z.number(),
  price: z.string(),
  subtotal: z.string(),
  /// Permintaan custom yang diketik pembeli saat mengajukan pesanan.
  notes: z.string().nullable(),
});

export const CustomerOrderData = z.object({
  orderId: z.string(),
  status: OrderStatus,
  deliveryMethod: OrderDeliveryMethod,
  /// Perkiraan dari harga katalog saat diajukan, sebelum nego.
  estimatedTotal: z.string(),
  /// Harga yang berlaku setelah disepakati.
  totalAmount: z.string(),
  dpAmount: z.string().nullable(),
  createdAt: z.string(),
  paymentMethodName: z.string(),
  /// Token Snap pesanan yang masih PENDING, supaya pembayaran bisa dilanjutkan.
  snapToken: z.string().nullable(),
  totalItems: z.number(),
  items: z.array(CustomerOrderItemData),
  shipment: OrderShipmentData.nullable(),
});

export type CustomerOrderItemDataType = z.infer<typeof CustomerOrderItemData>;
export type CustomerOrderDataType = z.infer<typeof CustomerOrderData>;

export const CustomerOrderListResponse = ApiSuccessResponse(
  z.array(CustomerOrderData),
);
export const CustomerOrderDetailResponse = ApiSuccessResponse(CustomerOrderData);
