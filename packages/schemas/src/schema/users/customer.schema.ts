import z from "zod";

export const CustomerSchema = z.object({
  name: z.string().min(3, "Nama minimal memiliki panjang 3 karakter"),
  email: z.email("Email tidak valid"),
  phone: z.string().min(10, "Nomor minimal memiliki panjang 10"),
  image: z.string().optional(),
});

export type CustomerSchemaInput = z.infer<typeof CustomerSchema>;

export const CustomerProfileSchema = CustomerSchema.omit({
  email: true,
  image: true,
});

export type CustomerProfileInput = z.infer<typeof CustomerProfileSchema>;

export const CustomerProfileData = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  image: z.string().nullable(),
});

export type CustomerProfileDataType = z.infer<typeof CustomerProfileData>;
