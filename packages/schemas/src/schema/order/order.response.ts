import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

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
