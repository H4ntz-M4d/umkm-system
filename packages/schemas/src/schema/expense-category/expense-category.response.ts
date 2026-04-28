import z from "zod";

export const ExpenseCategoryData = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
  expenseCount: z.number(),
});

export type ExpenseCategoryResponse = z.infer<typeof ExpenseCategoryData>;
