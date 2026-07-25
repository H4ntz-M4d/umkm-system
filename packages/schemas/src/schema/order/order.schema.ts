import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";

export const OrderStatus = z.enum(["PENDING", "PAID", "CANCELLED"]);

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
});

export type OrderQueryInput = z.infer<typeof OrderQuerySchema>;
