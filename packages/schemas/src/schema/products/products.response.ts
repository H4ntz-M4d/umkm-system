import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { ProductStatusEnum } from "./products.schema";

export const VariantValuesData = z.object({
  id: z.string(),
  value: z.string(),
});

export const VariantTypesData = z.object({
  id: z.string(),
  name: z.string(),
  values: z.array(VariantValuesData),
});

export const VariantData = z.object({
  id: z.string(),
  sku: z.string(),
  price: z.string(),
  cost: z.string(),
  image: z.string().optional().nullable(),
  productVariantStocks: z.number().optional(),
});

export const ProductsData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: ProductStatusEnum,
  slug: z.string(),
  useVariant: z.boolean(),
  createdAt: z.string(),
  variants: z.array(VariantData),
});

export const ProductDataById = ProductsData.pick({
  name: true,
  description: true,
  useVariant: true,
  status: true,
}).extend({
  variants: z.array(
    VariantData.extend({
      options: z.record(z.string(), z.string()),
    }),
  ),
  variantTypes: z.array(VariantTypesData),
});

export const CreateUpdateProductData = ProductsData.pick({
  id: true,
  name: true,
  description: true,
  useVariant: true,
  status: true,
}).extend({
  variants: z.array(
    VariantData.pick({
      id: true,
      sku: true,
      price: true,
      cost: true,
    }),
  ),
});

export const AllProductResponse = ApiSuccessResponse(z.array(ProductsData));

export const ProductResponseById = ApiSuccessResponse(ProductDataById);

export const ProductsResponse = ApiSuccessResponse(CreateUpdateProductData);
