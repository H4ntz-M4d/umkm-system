import z from "zod";
import { ApiSuccessResponse } from "../../api.schema.response";

export const PaymentData = z.object({
  id: z.string(),
  name: z.string(),
  channel: z.string(),
  isActive: z.boolean(),
  /// Kosong = berlaku di semua toko.
  storeId: z.string().nullable().default(null),
  storeName: z.string().nullable().default(null),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  /// Terisi hanya untuk channel QRIS_STATIC.
  merchantName: z.string().optional(),
  qrImage: z.string().optional(),
});

/// Balasan unggahan gambar QR: hanya URL-nya.
export const QrisImageResponse = ApiSuccessResponse(
  z.object({ image: z.string() }),
);

export type PaymentResponseData = z.infer<typeof PaymentData>;

export const PaymentResponse = ApiSuccessResponse(z.array(PaymentData));
export const PaymentResponseMutate = ApiSuccessResponse(PaymentData);
