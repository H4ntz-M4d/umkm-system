import { PaymentChannelEnum, z } from "@repo/schemas";

type PaymentChannel = z.infer<typeof PaymentChannelEnum>;

/**
 * Nama channel yang dibaca manusia.
 *
 * Ditulis sekali di sini karena dipakai layar pengelolaan DAN layar kasir.
 * Penting sejak ada dua channel QRIS: nama metode buatan admin bisa saja
 * sama-sama "Qris", dan yang membedakan cara kerjanya hanya keterangan ini.
 */
export const PAYMENT_CHANNEL_LABEL: Record<PaymentChannel, string> = {
  CASH: "Tunai",
  BANK_TRANSFER: "Transfer Bank",
  MIDTRANS: "QRIS Midtrans (otomatis)",
  QRIS_STATIC: "QRIS Tempel (bukti manual)",
};

export function paymentChannelLabel(channel: string) {
  return PAYMENT_CHANNEL_LABEL[channel as PaymentChannel] ?? channel;
}
