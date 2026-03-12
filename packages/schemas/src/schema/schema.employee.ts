import z from "zod";
import { UsersSchema } from "./schema.users";

export const EmployeeSchema = UsersSchema.extend({
    address: z.string().min(3).max(100),
    phone: z.string().min(10).optional(),
    image: z.string().max(255).optional(),
    confirmPassword: z.string().min(6, "Password konfirmasi password minimal memiliki 6 karakter")
}).refine(
    (data) => data.password === data.confirmPassword,
    {
        message: "Konfirmasi password tidak sama dengan password",
        path: ["confirmPassword"]
    }
)

export const EmployeeUpdateSchema = UsersSchema.extend({
    address: z.string().min(3).max(100).optional(),
    phone: z.string().min(10).optional(),
    image: z.string().max(255).optional(),
    // password update sifatnya optional
    password: z.string().min(6).optional(),
    confirmPassword: z.string().min(6).optional(),
})
    .partial() // aman karena schema ini TIDAK punya refine sebelumnya
    .superRefine((data, ctx) => {
        const hasPassword = typeof data.password === "string" && data.password.length > 0;
        const hasConfirm = typeof data.confirmPassword === "string" && data.confirmPassword.length > 0;
        // kalau salah satu diisi, wajib dua-duanya
        if (hasPassword !== hasConfirm) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Password dan konfirmasi password harus diisi keduanya saat update password",
            });
            return;
        }
        // kalau dua-duanya ada, harus sama
        if (hasPassword && hasConfirm && data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Konfirmasi password tidak sama dengan password",
            });
        }
    });


export type EmployeeSchemaInput = z.input<typeof EmployeeSchema>
export type EmployeeUpdateSchemaInput = z.input<typeof EmployeeUpdateSchema>;
