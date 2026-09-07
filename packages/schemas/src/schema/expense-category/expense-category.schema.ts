import z from "zod";

export const ExpenseCategorySchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  description: z.string().optional(),
  color: z.string().min(3),
  isActive: z.boolean(),
});

export type ExpenseCategorySchemaInput = z.infer<typeof ExpenseCategorySchema>;