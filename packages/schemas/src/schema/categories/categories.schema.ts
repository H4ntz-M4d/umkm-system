import z from "zod";

export const CategoriesSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  status: z.boolean(),
  slug: z.string(),
});

export type CategoriesSchemaInput = z.infer<typeof CategoriesSchema>;
