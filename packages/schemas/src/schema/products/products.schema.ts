import z from "zod";

export const ProductStatusEnum = z.enum(["ACTIVE", "NONACTIVE", "DRAFT"]);

export const VariantValueSchema = z
  .string()
  .min(1, "Nilai dari variant minimal memiliki panjang 1 karakter");

export const VariantTypeSchema = z.object({
  name: z.string().min(3, "Nama variant minimal memiliki panjang 3 karakter"),
  values: z.array(VariantValueSchema).min(1),
});

export const VariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(3, "SKU wajib diisi dan tidak boleh ada yang sama"),
  price: z.number(),
  cost: z.number(),
  image: z.string().optional(),
  options: z.record(z.string(), z.string()),
});

export const ProductSchema = z.object({
  name: z.string().min(3, "Nama produk minimal memiliki panjang 3 karakter"),
  description: z
    .string()
    .min(5, "Deskripsi minimal memiliki panjang 5 karakter"),
  useVariant: z.boolean(),
  status: ProductStatusEnum,
  variants: z.array(VariantSchema).optional(),
  variantsTypes: z.array(VariantTypeSchema).optional(),
});

export type CreateProductSchemaInput = z.infer<typeof ProductSchema>;

export const UpdateProductSchema = ProductSchema.partial();
export type UpdateProductSchemaInput = z.infer<typeof UpdateProductSchema>;
