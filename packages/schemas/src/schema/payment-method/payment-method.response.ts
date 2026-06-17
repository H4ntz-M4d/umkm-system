import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const PaymentData = z.object({
  id: z.string(),
  name: z.string(),
  channel: z.string(),
  isActive: z.boolean(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
});

export type PaymentResponseData = z.infer<typeof PaymentData>;

export const PaymentResponse = ApiSuccessResponse(z.array(PaymentData));
export const PaymentResponseMutate = ApiSuccessResponse(PaymentData);
