import { Decimal } from "@repo/utils";

export const toIDR = (value: Decimal | string | number) => {
  const amount = value instanceof Decimal ? value.toNumber() : Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Bentuk ringkas untuk label sumbu grafik ("Rp 12,4 jt"). Nilai penuh tetap
 * disediakan di tooltip dan tabel, jadi pemendekan di sini tidak menghilangkan
 * informasi — hanya menjaga sumbu tetap terbaca.
 */
export const toIDRCompact = (value: Decimal | string | number) => {
  const amount = value instanceof Decimal ? value.toNumber() : Number(value);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
};
