import z from "zod";

export const BeSpokeSchema = z.object({
  name: z.string().optional(),
  email: z.email("Format email tidak valid").or(z.literal("")).optional(),
  phone: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  quotedPrice: z.number({ message: "Harga usulan wajib diisi" }).optional(),
});

export const BeSpokeRequiredSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal memiliki panjang 3 karakter"),
  email: z.email("Format email tidak valid"),
  phone: z.string().trim().min(10, "Nomor minimal memiliki panjang 10 karakter"),
  title: z.string().trim().min(3, "Title minimal memiliki panjang 3 karakter"),
  description: z.string().optional(),
  quotedPrice: z.number({ message: "Harga usulan wajib diisi" }),
});

export type BeSpokeSchemaInput = z.infer<typeof BeSpokeSchema>;
export type BeSpokeRequiredSchemaInput = z.infer<typeof BeSpokeRequiredSchema>;
