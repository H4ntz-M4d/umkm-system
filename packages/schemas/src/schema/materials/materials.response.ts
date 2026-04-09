import { MaterialsSchema } from "./materials.schema";
import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const MaterialsData = MaterialsSchema.extend({
  id: z.string(),
});

export const MaterialsDataResponse = ApiSuccessResponse(
  z.array(MaterialsData),
);

export const SingleMaterialsDataResponse = ApiSuccessResponse(
  MaterialsData
)