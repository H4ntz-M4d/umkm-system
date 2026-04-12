import z from "zod";

export const ProductionMaterialSchema = z.object({
  rawMaterialId: z.number(),
  quantityUsed: z.number().positive(),
});

export const ProductionSchema = z.object({
  storeId: z.number(),
  producedVariantId: z.number(),
  quantityProduced: z.number(),
  status: z.enum(["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]),
  materials: z.array(ProductionMaterialSchema),
});

export const UpdateProductionSchema = ProductionSchema.partial();
export const UpdateProductionMaterialSchema =
  ProductionMaterialSchema.partial();

export type CreateProductionSchemaInput = z.infer<typeof ProductionSchema>;
export type UpdateProductionSchemaInput = z.infer<
  typeof UpdateProductionSchema
>;
export type UpdateProductionMaterialSchemaInput = z.infer<
  typeof UpdateProductionMaterialSchema
>;
