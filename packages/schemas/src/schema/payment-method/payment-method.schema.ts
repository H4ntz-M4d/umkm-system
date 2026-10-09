import z from "zod";

export const PaymentChannelEnum = z.enum([
  "CASH",
  "BANK_TRANSFER",
  "MIDTRANS",
  /// QRIS tercetak milik toko; pelunasannya dipastikan kasir, bukan sistem.
  "QRIS_STATIC",
]);

export const BankAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
})

export const QrisAccountSchema = z.object({
  merchantName: z
    .string()
    .trim()
    .min(2, "Nama merchant di QR minimal 2 karakter"),
  /// URL gambar QR yang sudah diunggah lebih dulu. Formnya mengunggah
  /// gambar terpisah supaya penyimpanan metode tidak ikut menunggu unggahan.
  qrImage: z.string().min(1, "Gambar QR belum diunggah"),
});

export const PaymentMethodSchema = z.object({
  name: z.string().min(3, "Nama minimal memiliki 3 karakter"),
  channel: PaymentChannelEnum,
  isActive: z.boolean(),
  /// Toko pemilik metode ini; kosong berarti berlaku di semua toko.
  /// Dibiarkan opsional supaya data lama yang tidak mengirimnya tetap sah.
  storeId: z.string().nullable().optional(),
  bankAccount: BankAccountSchema.optional(),
  qrisAccount: QrisAccountSchema.optional(),
});

export type PaymentMethodSchemaInput = z.infer<typeof PaymentMethodSchema>
