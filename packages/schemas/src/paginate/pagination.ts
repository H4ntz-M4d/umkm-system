import z from "zod";

export const PaginationSchema = z.object({
    skip: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
})

export type PaginationInput = z.infer<typeof PaginationSchema>