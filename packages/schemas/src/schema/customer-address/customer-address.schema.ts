import z from "zod";

export const CustomerAddressSchema = z.object({
  recipientName: z
    .string()
    .min(3, "Nama penerima minimal memiliki panjang 3 karakter"),
  phone: z.string().min(8, "Nomor telepon tidak valid"),
  addressLine: z.string().min(5, "Alamat minimal memiliki panjang 5 karakter"),
  city: z.string().min(1, "Kota wajib diisi"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  isDefault: z.boolean().optional(),
});

export type CustomerAddressSchemaInput = z.infer<typeof CustomerAddressSchema>;

export const UpdateCustomerAddressSchema = CustomerAddressSchema.partial();
export type UpdateCustomerAddressSchemaInput = z.infer<
  typeof UpdateCustomerAddressSchema
>;
