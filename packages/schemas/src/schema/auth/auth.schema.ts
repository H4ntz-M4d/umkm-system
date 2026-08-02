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
    phone: z.string().min(10, 'Nomor minimal memiliki panjang 10').optional(),
    confirmPassword: z.string().min(6, 'Konfirmasi Password minimal memiliki 6 karakter')
}).refine((ctx) => {
    return ctx.password === ctx.confirmPassword
}, {
    message: 'Konfirmasi password tidak sama dengan password',
})

export type CustomerRegisterInput = z.infer<typeof CustomerRegisterSchema>

// ========================= Lupa / Ganti Kata Sandi ==========================

export const ForgotPasswordSchema = z.object({
    email: z.email('Email tidak valid'),
})

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>

/// Kode enam digit yang dikirim ke email.
export const ResetCodeSchema = z
    .string()
    .length(6, 'Kode verifikasi terdiri dari 6 digit')
    .regex(/^\d+$/, 'Kode verifikasi hanya berisi angka')

export const VerifyResetCodeSchema = z.object({
    email: z.email('Email tidak valid'),
    code: ResetCodeSchema,
})

export type VerifyResetCodeInput = z.infer<typeof VerifyResetCodeSchema>

export const ResetPasswordSchema = z
    .object({
        email: z.email('Email tidak valid'),
        code: ResetCodeSchema,
        password: z.string().min(6, 'Password minimal memiliki 6 karakter'),
        confirmPassword: z
            .string()
            .min(6, 'Konfirmasi Password minimal memiliki 6 karakter'),
    })
    .refine((ctx) => ctx.password === ctx.confirmPassword, {
        message: 'Konfirmasi password tidak sama dengan password',
        path: ['confirmPassword'],
    })

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>

/// Bentuk form langkah 2: hanya kode, email sudah diketahui dari langkah 1.
export const VerifyResetCodeFormSchema = z.object({
    code: ResetCodeSchema,
})

export type VerifyResetCodeFormInput = z.infer<typeof VerifyResetCodeFormSchema>

/// Bentuk form langkah 3: hanya kata sandi baru, email & kode sudah diketahui.
export const NewPasswordFormSchema = z
    .object({
        password: z.string().min(6, 'Password minimal memiliki 6 karakter'),
        confirmPassword: z
            .string()
            .min(6, 'Konfirmasi Password minimal memiliki 6 karakter'),
    })
    .refine((ctx) => ctx.password === ctx.confirmPassword, {
        message: 'Konfirmasi password tidak sama dengan password',
        path: ['confirmPassword'],
    })

export type NewPasswordFormInput = z.infer<typeof NewPasswordFormSchema>