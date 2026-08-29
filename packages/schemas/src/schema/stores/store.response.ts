import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const StoreResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  isOnlineSource: z.boolean(),
  isProductionHouse: z.boolean().optional(),
  createdAt: z.string(),
});

export type StoreData = z.infer<typeof StoreResponseSchema>;

export const StoreAllDataResponse = ApiSuccessResponse(
  z.array(StoreResponseSchema),
);

export const StoreListResponse = ApiSuccessResponse(
  z.array(
    StoreResponseSchema.pick({
      id: true,
      name: true,
      // Ikut dibawa supaya pemilih tujuan pengiriman bisa menyembunyikan rumah
      // produksi itu sendiri — kiriman ke diri sendiri tidak berarti apa-apa.
      isProductionHouse: true,
    }),
  ),
);

export const StoreSingleResponse = ApiSuccessResponse(StoreResponseSchema);
