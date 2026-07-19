import z from "zod";
import { PosTransactionSchema } from "./pos-transaction.schema";
import { ApiSuccessResponse } from "../../api.schema.response";

export const PosTransactionData = PosTransactionSchema.omit({
  itemTransaction: true,
}).extend({
  id: z.string(),
});

export const ItemsPosTransaction = z.object({
  productVariantId: z.string(),
  qty: z.number(),
  price: z.string(),
  itemTransactionName: z.string(),
  itemTransactionVariantOpt: z.string().optional().nullable(),
});

export const PosTransactionsParkedData = PosTransactionSchema.pick({
  transId: true,
  status: true,
}).extend({
  itemTransaction: z.array(ItemsPosTransaction),
});

export const PosTransactionResponse = ApiSuccessResponse(
  z.array(PosTransactionData),
);

export const PosTransactionGetStatusResponse = ApiSuccessResponse(
  PosTransactionData.pick({ status: true }),
);

export const PosTransactionResponseMutation = ApiSuccessResponse(
  PosTransactionData.extend({
    qrString: z.string().optional().nullable(),
    qrUrl: z.string().optional().nullable(),
  }),
);

export const PosTransactionsParkedResponse = ApiSuccessResponse(
  z.array(PosTransactionsParkedData),
);
