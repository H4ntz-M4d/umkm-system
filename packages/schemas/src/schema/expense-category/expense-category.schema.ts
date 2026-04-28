import z from "zod";

export const ExpenseCategorySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  color: z.string().min(3),
  isActive: z.boolean(),
  isMaterialsCategory: z.boolean(),
});

export type ExpenseCategorySchemaInput = z.infer<typeof ExpenseCategorySchema>;