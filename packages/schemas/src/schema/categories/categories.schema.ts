import z from "zod";

export const CategoriesSchema = z.object({
  name: z.string().min(3, "Nama kategori minimal memiliki panjang 3 karakter"),
  description: z.string().min(3, "Deskripsi minimal memiliki panjang 3 karakter"),
  status: z.boolean(),
  slug: z.string(),
});

export type CategoriesSchemaInput = z.infer<typeof CategoriesSchema>;
