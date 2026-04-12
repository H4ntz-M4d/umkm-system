import { Decimal } from "@repo/utils";

export const toIDR = (value: Decimal | string | number) => {
  const amount = value instanceof Decimal ? value.toNumber() : Number(value);

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};