
import { ApiSuccessResponse } from "../../api.schema.response";
import z from "zod";

export const UsersSchemaResponse = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "ADMIN", "KASIR", "GUDANG", "CUSTOMER"]),
  isActive: z.boolean(),
  createdAt: z.string(),
  slug: z.string().optional().nullable(),
  storeId: z.string().optional().nullable()
})

export const UsersWithEmployeeSchemaResponse = UsersSchemaResponse.pick({
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  storeId: true,
}).extend({
  address: z.string().optional(),
  phone: z.string().optional(),
  image: z.string().optional().nullable(),
})

export const EmployeeSchemaResponse = UsersWithEmployeeSchemaResponse.pick({
  id: true,
  name: true,
  address: true,
  phone: true,
  image: true,
})

export const AllUsersDataResponse = ApiSuccessResponse(
  z.array(UsersSchemaResponse)
)

export const SingleUsersDataResponse = ApiSuccessResponse(
  UsersSchemaResponse
)

export const SingleUsersWithEmployeeDataResponse = ApiSuccessResponse(
  UsersWithEmployeeSchemaResponse,
);

export const SingleEmployeeDataResponse = ApiSuccessResponse(
  EmployeeSchemaResponse
)