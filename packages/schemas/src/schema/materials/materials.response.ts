import { MaterialsSchema } from "./materials.schema";
import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";
import { Decimal } from "@repo/utils";

export const MaterialsData = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  cost: z.string().transform((val) => new Decimal(val)),
  isActive: z.boolean(),
})

export const MaterialsDataResponse = ApiSuccessResponse(z.array(MaterialsData));

export const SingleMaterialsDataResponse = ApiSuccessResponse(MaterialsData);

export const RawMaterialListResponse = ApiSuccessResponse(
  z.array(MaterialsData.pick({ id: true, name: true })),
);
