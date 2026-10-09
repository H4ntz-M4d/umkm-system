import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { ProductionStatusEnum } from "./production.schema";

/// Baris varian dalam batch, beserta kemajuannya.
export const ProductionItemData = z.object({
  id: z.coerce.string(),
  productVariantId: z.coerce.string(),
  productName: z.string(),
  sku: z.string(),
  variantLabel: z.string(),
  targetQuantity: z.number(),
  deliveredQuantity: z.number(),
});

export const ProductionDeliveryItemData = z.object({
  productionItemId: z.coerce.string(),
  productName: z.string(),
  sku: z.string(),
  quantity: z.number(),
});

export const ProductionDeliveryData = z.object({
  id: z.coerce.string(),
  deliveredAt: z.union([z.date(), z.string()]).transform((v) => String(v)),
  note: z.string().nullable(),
  recordedByName: z.string().nullable(),
  items: z.array(ProductionDeliveryItemData),
});

export const ProductionData = z.object({
  id: z.coerce.string(),
  code: z.string(),
  status: ProductionStatusEnum,
  targetDate: z.union([z.date(), z.string()]).transform((v) => String(v)),
  notes: z.string().nullable(),
  createdAt: z.union([z.date(), z.string()]).transform((v) => String(v)),
  completedAt: z
    .union([z.date(), z.string()])
    .nullable()
    .transform((v) => (v ? String(v) : null)),
  /// Nomor batch sebelumnya, bila batch ini melanjutkan sisanya.
  parentCode: z.string().nullable(),
  variantCount: z.number(),
  totalTarget: z.number(),
  totalDelivered: z.number(),
});

export const ProductionDetailData = ProductionData.extend({
  items: z.array(ProductionItemData),
  deliveries: z.array(ProductionDeliveryData),
});

export const ProductionSummary = z.object({
  planned: z.number(),
  inProgress: z.number(),
  completed: z.number(),
  cancelled: z.number(),
  /// Sisa target seluruh batch yang masih berjalan — angka yang paling
  /// sering ditanya owner: "berapa lagi yang belum jadi?"
  outstandingQuantity: z.number(),
});

export type ProductionDataType = z.infer<typeof ProductionData>;
export type ProductionDetailDataType = z.infer<typeof ProductionDetailData>;
export type ProductionItemDataType = z.infer<typeof ProductionItemData>;

export const ProductionResponse = ApiSuccessResponse(z.array(ProductionData));
export const ProductionDetailResponse = ApiSuccessResponse(
  ProductionDetailData,
);
export const ProductionSummaryResponse = ApiSuccessResponse(ProductionSummary);
