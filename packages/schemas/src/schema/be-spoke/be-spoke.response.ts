import z, { email } from "zod";

export const BeSpokeCustomer = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string(),
});

export const BeSpokeData = z.object({
  customerId: z.string(),
  title: z.string(),
  description: z.string(),
  quotedPrice: z.string(),
  customer: BeSpokeCustomer.optional()
});

export type BeSpokeResponse = z.infer<typeof BeSpokeData>;
