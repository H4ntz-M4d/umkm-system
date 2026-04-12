import z, { string } from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const ProductionMaterialData = z.object({
  id: z.string(),
  productionId: z.string(),
  rawMaterialId: z.string(),
  quantityUsed: z.number(),
  nameRawMaterial: z.string(),
  unitRawMaterial: z.string(),
});

export const ProductionData = z.object({
  id: z.string(),
  storeId: z.string(),
  producedVariantId: z.string(),
  sku: z.string(),
  productName: z.string(),
  quantityProduced: z.number(),
  status: z.string(),
  createdAt: z.string(),
  materials: z.array(ProductionMaterialData),
});

export const ProductionDataOnly = ProductionData.pick({
  id: true,
  storeId: true,
  producedVariantId: true,
  quantityProduced: true,
  status: true,
  createdAt: true,
});

export const ProductionMaterialDataOnly = ProductionMaterialData.pick({
  id: true,
  productionId: true,
  rawMaterialId: true,
  quantityUsed: true,
});

export const ProductionResponse = ApiSuccessResponse(z.array(ProductionData));

export const ProductionDataResponse = ApiSuccessResponse(ProductionDataOnly);

export const ProductionMaterialResponse = ApiSuccessResponse(
  ProductionMaterialDataOnly,
);
