import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { OrderStatus, ShipmentStatus } from "./order.schema";

export const OrderItemData = z.object({
  id: z.coerce.string(),
  productName: z.string(),
  quantity: z.coerce.string(),
  price: z.coerce.string(),
  subtotal: z.coerce.string(),
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

export const OrderData = z.object({
  storeId: z.coerce.string(),
  storeName: z.string(),
  customerName: z.string(),
  orderId: z.string(),
  paymentMethodName: z.string(),
  status: z.string(),
  totalAmount: z.coerce.string(),
  createdAt: z.union([z.date(), z.string()]).transform((val) => String(val)),
  items: z.array(OrderItemData),
  shipment: OrderShipmentData.nullable(),
});

export type OrderItemDataType = z.infer<typeof OrderItemData>;
export type OrderShipmentDataType = z.infer<typeof OrderShipmentData>;
export type OrderDataType = z.infer<typeof OrderData>;

export const OrderResponse = ApiSuccessResponse(z.array(OrderData));

export const UpdateShipmentData = z.object({
  orderId: z.string(),
  shipmentStatus: ShipmentStatus.nullable(),
  trackingNumber: z.string().nullable(),
  /// Status pesanan setelah diselaraskan dengan status pengiriman.
  orderStatus: OrderStatus,
});

export type UpdateShipmentDataType = z.infer<typeof UpdateShipmentData>;

export const UpdateShipmentResponse = ApiSuccessResponse(UpdateShipmentData);

// =========================== Sisi Customer ===================================

export const CheckoutData = z.object({
  orderId: z.string(),
  snapToken: z.string(),
  redirectUrl: z.string(),
  totalAmount: z.string(),
});

export const CheckoutResponse = ApiSuccessResponse(CheckoutData);
export type CheckoutDataType = z.infer<typeof CheckoutData>;

/// Lebih kaya dari OrderItemData milik admin: membawa gambar dan slug supaya
/// riwayat pesanan bisa menampilkan produk dan menautkannya kembali.
export const CustomerOrderItemData = z.object({
  id: z.string(),
  productName: z.string(),
  slug: z.string(),
  image: z.string().nullable(),
  options: z.record(z.string(), z.string()),
  quantity: z.number(),
  price: z.string(),
  subtotal: z.string(),
});

export const CustomerOrderData = z.object({
  orderId: z.string(),
  status: OrderStatus,
  totalAmount: z.string(),
  createdAt: z.string(),
  paymentMethodName: z.string(),
  /// Token Snap pesanan yang masih PENDING, supaya pembayaran bisa dilanjutkan.
  snapToken: z.string().nullable(),
  totalItems: z.number(),
  items: z.array(CustomerOrderItemData),
  shipment: OrderShipmentData.nullable(),
});

export type CustomerOrderDataType = z.infer<typeof CustomerOrderData>;

export const CustomerOrderListResponse = ApiSuccessResponse(
  z.array(CustomerOrderData),
);
export const CustomerOrderDetailResponse = ApiSuccessResponse(CustomerOrderData);
