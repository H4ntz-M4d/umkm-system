import z from "zod";

export function ApiSuccessResponse<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      timeStamp: z.string(),
      skip: z.number().optional(),
      limit: z.number().optional(),
      total: z.number().optional(),
    }),
  });
}

export const ApiErrorResponse = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
  meta: z.object({
    timeStamp: z.string(),
  }),
});
