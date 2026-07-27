import z from "zod";
import { PaginationSchema } from "../../paginate/pagination";
import { ProductTypeEnum } from "../products/products.schema";

export const PublicProductSortEnum = z.enum([
  "newest",
  "price_asc",
  "price_desc",
]);

export const PublicProductQuerySchema = PaginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  type: ProductTypeEnum.optional(),
  sort: PublicProductSortEnum.optional(),
});

export type PublicProductQueryInput = z.infer<typeof PublicProductQuerySchema>;
export type PublicProductSort = z.infer<typeof PublicProductSortEnum>;
