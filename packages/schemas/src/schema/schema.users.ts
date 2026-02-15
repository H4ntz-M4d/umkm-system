import z from "zod";

export const UsersSchema = z.object({
    name: z.string().min(3, 'Nama minimal memiliki 3 karakter'),
    email: z.email('Format email tidak valid'),
    password: z.string().min(6, 'Password minimal memiliki panjang 6 karakter'),
    role: z.enum(["OWNER", "ADMIN", "KASIR", "GUDANG", "CUSTOMER"]),
    isActive: z.boolean().default(true),
    storeId: z.number().positive().optional()
})

export type UsersSchemaInput = z.infer<typeof UsersSchema>