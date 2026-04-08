import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const message = z.string();

export const BaseProfile = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  isActive: z.boolean(),
});

export const UsersProfile = z.discriminatedUnion("role", [
  BaseProfile.extend({
    role: z.enum(["ADMIN", "GUDANG", "KASIR", "OWNER"]),
    storeId: z.string().optional(),
  }),

  BaseProfile.extend({
    role: z.enum(["CUSTOMER"]),
  }),
]);

export const RegisterResponse = BaseProfile.pick({
  name: true,
  email: true,
}).extend({
  phone: z.string(),
  usersId: z.string().optional(),
})

export const LoginResponse = ApiSuccessResponse(
  z.object({ message: message }),
);

export const UserProfileResponse = ApiSuccessResponse(UsersProfile);

export const RegisterCustomerResponse = ApiSuccessResponse(RegisterResponse);
