import z from "zod";

export const LoginSchema = z.object({
    email: z.email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal memiliki 6 karakter')
})

export type LoginInput = z.infer<typeof LoginSchema>

export const CustomerRegisterSchema = z.object({
    name: z.string().min(3, 'Nama minimal memiliki panjang 3 karakter'),
    email: z.email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal memiliki 6 karakter'),
    phone: z.string().min(10, 'Nomor minimal memiliki panjang 10').optional()
})

export type CustomerRegisterInput = z.infer<typeof CustomerRegisterSchema>