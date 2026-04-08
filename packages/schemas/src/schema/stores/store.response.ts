import z from "zod";
import {ApiSuccessResponse} from "../../api.schema.response";

export const StoreResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string()
})

export type StoreData = z.infer<typeof StoreResponseSchema>;

export const StoreAllDataResponse = ApiSuccessResponse(
  z.array(StoreResponseSchema)
)

export const StoreListResponse = ApiSuccessResponse(
    z.array(StoreResponseSchema.pick({
      id: true,
      name: true
    }))
);

export const StoreSingleResponse = ApiSuccessResponse(
  StoreResponseSchema
)