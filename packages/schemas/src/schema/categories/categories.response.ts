import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const CategoriesData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.boolean(),
  slug: z.string(),
  productCount: z.number(),
});

export const CategoriesSummary = z.object({
  totalCategories: z.number(),
  activeCategories: z.number(),
  linkedProducts: z.number(),
});

export const CategoriesResponse = ApiSuccessResponse(z.array(CategoriesData));
export const CategoriesSummaryResponse = ApiSuccessResponse(CategoriesSummary);

export const CategoryListResponse = ApiSuccessResponse(
  z.array(
    CategoriesData.pick({
      id: true,
      name: true,
    }),
  ),
);

export const CategoryResponse = ApiSuccessResponse(
  CategoriesData.omit({ productCount: true }),
);
