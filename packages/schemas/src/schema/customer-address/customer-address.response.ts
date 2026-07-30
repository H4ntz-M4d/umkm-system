import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const CustomerAddressData = z.object({
  id: z.string(),
  recipientName: z.string(),
  phone: z.string(),
  addressLine: z.string(),
  city: z.string(),
  province: z.string(),
  isDefault: z.boolean(),
});

export type CustomerAddressDataType = z.infer<typeof CustomerAddressData>;

export const CustomerAddressListResponse = ApiSuccessResponse(
  z.array(CustomerAddressData),
);
export const CustomerAddressResponse = ApiSuccessResponse(CustomerAddressData);
