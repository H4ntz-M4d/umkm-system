import z from "zod";

export const StoreSchema = z.object({
    name: z.string().min(3, "Nama minimal 3 karakter"),
    isActive: z.boolean().optional()
})

export type StoreInput = z.infer<typeof StoreSchema>

export const StoreResponseSchema = StoreSchema.extend({
    id: z.bigint(),
    createdAt: z.date()
})

export type StoreResponse = z.infer<typeof StoreResponseSchema>
