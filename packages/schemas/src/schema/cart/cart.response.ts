import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const CartItemData = z.object({
  id: z.string(),
  productVariantId: z.string(),
  productMasterId: z.string(),
  slug: z.string(),
  sku: z.string(),
  productName: z.string(),
  productType: z.string(),
  price: z.string(),
  image: z.string().nullable(),
  stock: z.number(),
  quantity: z.number(),
  options: z.record(z.string(), z.string()),
  subtotal: z.string(),
});

export const CartData = z.object({
  id: z.string().nullable(),
  items: z.array(CartItemData),
  totalItems: z.number(),
  totalAmount: z.string(),
});

export type CartItemDataType = z.infer<typeof CartItemData>;
export type CartDataType = z.infer<typeof CartData>;

export const CartResponse = ApiSuccessResponse(CartData);
