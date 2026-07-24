import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const TransactionFlowData = z.object({
  id: z.coerce.string(),
  storeId: z.coerce.string(),
  storeName: z.string(),
  type: z.string(),
  amount: z.coerce.number(),
  source: z.string(),
  createdAt: z.union([z.date(), z.string()]).transform((val) => String(val)),
});

export const TransactionFlowSummary = z.object({
  transactionIn: z.number(),
  transactionOut: z.number(),
  netTransaction: z.number(),
});

export type TransactionFlowDataType = z.infer<typeof TransactionFlowData>;
export type TransactionFlowSummaryType = z.infer<typeof TransactionFlowSummary>;

export const TransactionFlowResponse = ApiSuccessResponse(
  z.array(TransactionFlowData),
);

export const SummaryTransactionResponse = ApiSuccessResponse(
  TransactionFlowSummary,
);
