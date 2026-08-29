import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { ProductTypeEnum } from "../products/products.schema";
import {
  ImageGroupData,
  VariantTypesData,
} from "../products/products.response";

/// Kartu produk di katalog. priceMin/priceMax diratakan backend dari variants
/// supaya kartu tidak perlu membawa seluruh daftar variant.
export const PublicProductCardData = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  type: ProductTypeEnum,
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  image: z.string().nullable(),
  priceMin: z.string(),
  priceMax: z.string(),
  totalStock: z.number(),
  productPreOrderDetail: z
    .object({ maxQuota: z.number(), endDate: z.string() })
    .nullable()
    .optional(),
});

export const PublicProductVariantData = z.object({
  id: z.string(),
  sku: z.string(),
  price: z.string(),
  image: z.string().nullable(),
  imageGroupId: z.string().nullable(),
  stock: z.number(),
  /// Peta namaTipeVariant -> nilai, dipakai selector di halaman detail untuk
  /// mencocokkan kombinasi pilihan user ke satu variant.
  options: z.record(z.string(), z.string()),
});

export const PublicProductDetailData = PublicProductCardData.extend({
  useVariant: z.boolean(),
  variants: z.array(PublicProductVariantData),
  variantTypes: z.array(VariantTypesData),
  imageGroups: z.array(ImageGroupData),
});

export const PublicCategoryData = z.object({
  id: z.string(),
  name: z.string(),
});

export type PublicProductCardDataType = z.infer<typeof PublicProductCardData>;
export type PublicProductDetailDataType = z.infer<
  typeof PublicProductDetailData
>;
export type PublicProductVariantDataType = z.infer<
  typeof PublicProductVariantData
>;
export type PublicCategoryDataType = z.infer<typeof PublicCategoryData>;

export const PublicProductsResponse = ApiSuccessResponse(
  z.array(PublicProductCardData),
);
export const PublicProductDetailResponse = ApiSuccessResponse(
  PublicProductDetailData,
);
export const PublicCategoriesResponse = ApiSuccessResponse(
  z.array(PublicCategoryData),
);
