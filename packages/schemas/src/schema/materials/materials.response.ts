import { MaterialsSchema } from "./materials.schema";
import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const MaterialsData = MaterialsSchema.extend({
  id: z.string(),
});

export const MaterialsDataResponse = ApiSuccessResponse(z.array(MaterialsData));

export const SingleMaterialsDataResponse = ApiSuccessResponse(MaterialsData);

export const RawMaterialListResponse = ApiSuccessResponse(
  z.array(MaterialsData.pick({ id: true, name: true })),
);
