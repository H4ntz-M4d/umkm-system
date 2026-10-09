import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { BespokeStatus } from "./be-spoke.schema";

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

export const BespokeOrderData = z.object({
  id: z.coerce.string(),
  code: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  /// Kosong berarti desainnya di luar katalog.
  productMasterId: z.coerce.string().nullable().default(null),
  productMasterName: z.string().nullable().default(null),
  quantity: z.number(),
  quotedPrice: z.coerce.string(),
  status: BespokeStatus,
  targetDate: z.union([z.date(), z.string()]).transform((val) => String(val)),
  notes: z.string().nullable(),
  completedAt: z
    .union([z.date(), z.string()])
    .nullable()
    .transform((val) => (val ? String(val) : null)),
  createdAt: z.union([z.date(), z.string()]).transform((val) => String(val)),
  customerName: z.string().nullable(),
  customerEmail: z.string().nullable(),
  customerPhone: z.string().nullable(),
});

export type BespokeOrderDataType = z.infer<typeof BespokeOrderData>;

export const BespokeOrderListResponse = ApiSuccessResponse(
  z.array(BespokeOrderData),
);
export const BespokeOrderResponse = ApiSuccessResponse(BespokeOrderData);

/// Ringkasan papan pesanan custom: jumlah per status + nilai yang sudah masuk.
export const BespokeSummaryData = z.object({
  planned: z.number(),
  inProgress: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  completedValue: z.coerce.string(),
});

export const BespokeSummaryResponse = ApiSuccessResponse(BespokeSummaryData);
