import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const ExpenseItemData = z.object({
  id: z.string(),
  expenseId: z.string(),
  rawMaterialId: z.string().nullable(),
  itemName: z.string().nullable(),
  quantity: z.number(),
  unit: z.string(),
  price: z.string(),
  subtotal: z.string(),
});

export const ExpenseData = z.object({
  id: z.string(),
  storeId: z.string(),
  categoryId: z.string(),
  description: z.string().nullable(),
  totalAmount: z.string(),
  date: z.string(),
  createdAt: z.string(),
});

export const ExpenseDetailData = ExpenseData.extend({
  expenseItem: z.array(ExpenseItemData),
});

export const CreateExpenseResponse = ApiSuccessResponse(ExpenseDetailData);
export const ExpenseListResponse = ApiSuccessResponse(z.array(ExpenseData));
export const SingleExpenseResponse = ApiSuccessResponse(ExpenseDetailData);
