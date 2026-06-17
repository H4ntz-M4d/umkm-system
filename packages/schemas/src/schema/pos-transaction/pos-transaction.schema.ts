import z from "zod";

export const PostTransactionStatus = z.enum([
  "PENDING",
  "PARKED",
  "PAID",
  "CANCELLED",
]);

export const PosTransactionItemSchema = z.object({
  productVariantId: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const PosTransactionSchema = z.object({
  transId: z.string().nullable(),
  storeId: z.string(),
  cashierId: z.string(),
  paymentMethodId: z.string().optional().nullable(),
  status: PostTransactionStatus,
  itemTransaction: z.array(PosTransactionItemSchema),
});

export type PosTransactionSchemaInput = z.infer<typeof PosTransactionSchema>;
