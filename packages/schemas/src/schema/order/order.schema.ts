import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

export const OrderStatus = z.enum([
  "PENDING",
  "PAID",
  "CANCELLED",
  "SHIPPED",
  "COMPLETED",
  "REFUNDED",
]);

export const ShipmentStatus = z.enum([
  "PACKAGING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);

export type ShipmentStatusInput = z.infer<typeof ShipmentStatus>;

export const UpdateShipmentSchema = z.object({
  status: ShipmentStatus,
  trackingNumber: z.string().max(100).optional().nullable(),
});

export type UpdateShipmentInput = z.infer<typeof UpdateShipmentSchema>;

export const OrderItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number(),
  price: z.number(),
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
  paymentMethodId: z.string(),
  status: OrderStatus,
  totalAmount: z.number(),
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

// =============================== Checkout ====================================

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

export const MyOrderQuerySchema = PaginationSchema.extend({
  status: OrderStatus.optional(),
});

export type MyOrderQueryInput = z.infer<typeof MyOrderQuerySchema>;
