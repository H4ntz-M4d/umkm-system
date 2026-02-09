import z from "zod";

export function ApiSuccessResponse <T extends z.ZodType>(data: T){
    z.object({
        success: z.literal(true),
        data,
        meta: z.object({
            timeStamp: z.string()
        })
    })
}