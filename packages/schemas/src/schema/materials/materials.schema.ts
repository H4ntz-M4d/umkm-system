import z from "zod";

export const MaterialsSchema = z.object({
    name: z.string().min(3, "Nama di butuhkan dan minimal memiliki panjang 3 karakter"),
    unit: z.string().min(1, "Unit satuan wajib diisi datanya"),
    cost: z.number().optional(),
    isActive: z.boolean(),
})

export const UpdateMaterialsSchema = MaterialsSchema.partial()

export type CreateMaterialsSchemaInput = z.infer<typeof MaterialsSchema>
export type UpdateMaterialsSchemaInput = z.infer<typeof UpdateMaterialsSchema>