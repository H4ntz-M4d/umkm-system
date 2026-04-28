import z, { string } from "zod";

export const ExpenseItemSchema = z.object({
  rawMaterialId: z.string().optional(),
  itemName: z.string().min(3).optional(),
  quantity: z.number(),
  unit: z.string(),
  price: z.number(),
  subtotal: z.number(),
});

export const ExpenseSchema = z.object({
  storeId: z.string(),
  categoryId: z.string(),
  description: z.string().min(3).optional(),
  totalAmount: z.number(),
  date: z.coerce.date(),
  expenseItem: z.array(ExpenseItemSchema),
});

export type ExpenseSchemaInput = z.infer<typeof ExpenseSchema>;
export type ExpenseItemSchemaInput = z.infer<typeof ExpenseItemSchema>;
