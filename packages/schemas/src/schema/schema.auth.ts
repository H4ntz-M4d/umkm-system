import z from "zod";

export const LoginSchema = z.object({
    email: z.email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal memiliki 6 karakter')
})

export type LoginInput = z.infer<typeof LoginSchema>