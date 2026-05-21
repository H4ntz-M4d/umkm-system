import z from "zod";
import { PosTransactionSchema } from "./pos-transaction.schema";
import { ApiSuccessResponse } from "../../api.schema.response";

export const PosTransactionData = PosTransactionSchema.omit({
  itemTransaction: true,
}).extend({
  id: z.string(),
});

export const PosTransactionResponse = ApiSuccessResponse(
  z.array(PosTransactionData),
);
