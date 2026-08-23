import z, { string } from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { BeSpokeCustomer, BeSpokeData } from "../be-spoke/be-spoke.response";

export const ProductionData = z.object({
  id: z.string(),
  storeId: z.string(),
  /// Toko tujuan hasil produksi. Stoknya sendiri mendarat di rumah produksi
  /// lebih dulu; bila tujuannya toko lain, kiriman dibuat otomatis.
  storeName: z.string().optional(),
  producedVariantId: z.string().optional().nullable(),
  sku: z.string().optional(),
  productName: z.string(),
  quantityProduced: z.number(),
  type: z.string(),
  status: z.string(),
  targetDate: z.coerce.date(),
  createdAt: z.string(),
  bespoke: BeSpokeData.extend({
    customer: BeSpokeCustomer.partial().optional(),
  })
    .partial()
    .optional()
    .nullable(),
});

export const ProductionDataOnly = ProductionData.pick({
  id: true,
  storeId: true,
  producedVariantId: true,
  quantityProduced: true,
  status: true,
  type: true,
  createdAt: true,
});

export const ProductionSummary = z.object({
  planned: z.number(),
  inProgress: z.number(),
  completed: z.number(),
  cancelled: z.number(),
});

export const ProductionResponse = ApiSuccessResponse(z.array(ProductionData));

export const ProductionDataResponse = ApiSuccessResponse(ProductionDataOnly);

export const ProductionSummaryResponse = ApiSuccessResponse(ProductionSummary);
