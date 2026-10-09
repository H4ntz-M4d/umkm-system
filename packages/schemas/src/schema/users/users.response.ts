
import { ApiSuccessResponse } from "../../api.schema.response";
import z from "zod";
import { CustomerProfileData } from "./customer.schema";

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

/**
 * Bentuk ringkas untuk mengisi dropdown "Diproses oleh" pada pesanan.
 *
 * Sengaja hanya id, nama, dan peran: dropdown ini juga dibuka Kasir, dan
 * daftar karyawan yang lengkap membawa email, toko, serta status akun yang
 * tidak ada urusannya dengan memilih nama.
 */
export const EmployeeOptionData = z.object({
  id: z.coerce.string(),
  name: z.string(),
  role: z.enum(["OWNER", "ADMIN", "KASIR", "GUDANG"]),
});

export type EmployeeOptionDataType = z.infer<typeof EmployeeOptionData>;

export const EmployeeOptionListResponse = ApiSuccessResponse(
  z.array(EmployeeOptionData),
);

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

export const SingleCustomerDataResponse = ApiSuccessResponse(
  CustomerProfileData,
)