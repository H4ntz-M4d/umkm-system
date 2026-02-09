import z from "zod";

export const StoreSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    isActive: z.boolean().optional()
}) 

export type StoreInput = z.infer<typeof StoreSchema>
