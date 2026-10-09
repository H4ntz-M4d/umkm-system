import z from "zod";
import { PosTransactionSchema } from "./pos-transaction.schema";
import { ApiSuccessResponse } from "../../api.schema.response";

export const PosTransactionData = PosTransactionSchema.omit({
  itemTransaction: true,
  cashierId: true,
  status: true,
}).extend({
  id: z.string(),
  status: z.string(),
  cashierName: z.string(),
  paymentMethod: z.string().nullable().optional(),
  storeName: z.string(),
  totalAmount: z.string(),
  createdAt: z.string(),
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

export type PosTransactionDataType = z.infer<typeof PosTransactionData>;

export const PosTransactionResponse = ApiSuccessResponse(
  z.array(PosTransactionData),
);

/// Varian yang stoknya jadi minus setelah pembayaran QRIS/transfer dicatat —
/// uangnya sudah masuk, jadi transaksi tetap Lunas dan kasir diberi peringatan.
export const PosStockWarningData = z.object({
  productName: z.string(),
  sku: z.string(),
  stock: z.number(),
});

export type PosStockWarningDataType = z.infer<typeof PosStockWarningData>;

export const PosTransactionGetStatusResponse = ApiSuccessResponse(
  PosTransactionData.pick({ status: true }).extend({
    stockWarnings: z.array(PosStockWarningData).default([]),
  }),
);

/**
 * Hasil pembatalan QR yang ditinggal.
 *
 * `cancelled: false` dengan `reason: "PAID"` bukan kegagalan — artinya
 * pembayarannya ternyata sudah masuk, jadi transaksinya sengaja dibiarkan
 * diselesaikan webhook.
 */
export const PosAbandonQrisResponse = ApiSuccessResponse(
  z.object({
    cancelled: z.boolean(),
    reason: z.enum(["PAID", "ALREADY_CANCELLED", "CANCELLED", "CHANGED"]),
  }),
);

/// Jumlah transaksi yang benar-benar dibatalkan (yang sudah batal dilewati).
export const PosCancelResponse = ApiSuccessResponse(
  z.object({ count: z.number() }),
);

export const PosPaymentProofResponse = ApiSuccessResponse(
  PosTransactionData.pick({ status: true }).extend({
    stockWarnings: z.array(PosStockWarningData).default([]),
  }),
);

export const PosTransactionResponseMutation = ApiSuccessResponse(
  PosTransactionData.extend({
    qrString: z.string().optional().nullable(),
    qrUrl: z.string().optional().nullable(),
  }).omit({
    cashierName: true,
    paymentMethod: true,
    storeName: true,
  }),
);

export const PosTransactionsParkedResponse = ApiSuccessResponse(
  z.array(PosTransactionsParkedData),
);
