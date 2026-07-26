import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const OrderTrendPoint = z.object({
  date: z.string(),
  online: z.number(),
  pos: z.number(),
});

export const ExpenseByCategoryPoint = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  color: z.string(),
  total: z.string(),
});

export const ProductionStatusPoint = z.object({
  status: z.string(),
  count: z.number(),
});

export const OmzetTrendPoint = z.object({
  date: z.string(),
  online: z.string(),
  pos: z.string(),
});

export const OrderTrendResponse = ApiSuccessResponse(z.array(OrderTrendPoint));
export const ExpenseByCategoryResponse = ApiSuccessResponse(
  z.array(ExpenseByCategoryPoint),
);
export const ProductionStatusResponse = ApiSuccessResponse(
  z.array(ProductionStatusPoint),
);
export const OmzetTrendResponse = ApiSuccessResponse(z.array(OmzetTrendPoint));
