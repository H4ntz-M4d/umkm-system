import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const ExpenseCategoryData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  isActive: z.boolean(),
  isMaterialsCategory: z.boolean(),
  createdAt: z.string(),
  expenseCount: z.number(),
  totalExpenses: z.number(),
});

export const SingleExpenseCategoryData = ExpenseCategoryData.pick({
  id: true,
  name: true,
  description: true,
  color: true,
  isActive: true,
  isMaterialsCategory: true,
  createdAt: true,
})

export type ExpenseCategoryResponse = z.infer<typeof ExpenseCategoryData>;

export const ExpenseCategoryListResponse = ApiSuccessResponse(
  z.array(ExpenseCategoryData),
);

export const SingleExpenseCategoryResponse =
  ApiSuccessResponse(SingleExpenseCategoryData);
