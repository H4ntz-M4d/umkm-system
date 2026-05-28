import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const CategoriesData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  status: z.boolean(),
  slug: z.string(),
});

export const CategoriesResponse = ApiSuccessResponse(
  z.array(
    CategoriesData.extend({
      productCount: z.number(),
    }),
  ),
);

export const CategoryListResponse = ApiSuccessResponse(
  z.array(
    CategoriesData.pick({
      id: true,
      name: true,
    }),
  ),
);

export const CategoryResponse = ApiSuccessResponse(CategoriesData);
