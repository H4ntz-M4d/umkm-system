import z from "zod";

export const PostTransactionStatus = z.enum([
  "DRAFT",
  "PARKED",
  "PAID",
  "CANCELLED",
]);

export const PosTransactionItemSchema = z.object({
  posTransactionId: z.string().optional(),
  productVariantId: z.string(),
  quantity: z.number(),
  price: z.number(),
  subtotal: z.number(),
});

export const PosTransactionSchema = z.object({
  transId: z.string().optional(),
  storeId: z.string(),
  cashierId: z.string(),
  paymentMethodId: z.string().optional(),
  status: PostTransactionStatus,
  totalAmount: z.number(),
  itemTransaction: z.array(PosTransactionItemSchema),
});

export type PosTransactionSchemaInput = z.infer<typeof PosTransactionSchema>;
