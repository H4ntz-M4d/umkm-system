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
    storeId: z.string().optional().nullable(),
    storeName: z.string().optional(),
  }),

  BaseProfile.extend({
    role: z.enum(["CUSTOMER"]),
    phone: z.string(),
    image: z.string().optional().nullable(),
  }),
]);

export const RegisterResponse = BaseProfile.pick({
  name: true,
  email: true,
}).extend({
  phone: z.string(),
  usersId: z.string().optional(),
});

export const LoginResponse = ApiSuccessResponse(z.object({ message: message }));

export const UserProfileResponse = ApiSuccessResponse(UsersProfile);

export const RegisterCustomerResponse = ApiSuccessResponse(RegisterResponse);

// ========================= Lupa / Ganti Kata Sandi ==========================

export const ForgotPasswordData = z.object({
  message: message,
  /// Email disamarkan sebagian ("bu**@gmail.com") supaya pengguna yakin kode
  /// dikirim ke alamat yang benar tanpa menampilkannya utuh.
  maskedEmail: z.string(),
  expiresInMinutes: z.number(),
});

export const ForgotPasswordResponse = ApiSuccessResponse(ForgotPasswordData);

export const VerifyResetCodeResponse = ApiSuccessResponse(
  z.object({ valid: z.literal(true), message: message }),
);

export const ResetPasswordResponse = ApiSuccessResponse(
  z.object({ message: message }),
);
