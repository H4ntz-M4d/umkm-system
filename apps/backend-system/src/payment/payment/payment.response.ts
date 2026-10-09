import { Prisma } from '@repo/db';

type PaymentEntity = Prisma.PaymentMethodGetPayload<{
  include: {
    bankAccount: true;
    qrisAccount: true;
    store: { select: { name: true } };
  };
}>;

export function toPaymentResponse(entity: PaymentEntity) {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    isActive: entity.isActive,
    /// Kosong berarti berlaku di semua toko — dibalas apa adanya supaya layar
    /// bisa menampilkannya sebagai "Semua toko", bukan menebaknya sendiri.
    storeId: entity.storeId ? String(entity.storeId) : null,
    storeName: entity.store?.name ?? null,
    bankName: entity.bankAccount?.bankName,
    accountName: entity.bankAccount?.accountName,
    accountNumber: entity.bankAccount?.accountNumber,
    /// Hanya terisi untuk QRIS tercetak; layar kasir memakai gambarnya.
    merchantName: entity.qrisAccount?.merchantName,
    qrImage: entity.qrisAccount?.qrImage,
  };
}

type PaymentEntityOnly = Prisma.PaymentMethodGetPayload<{
  select: {
    id: true;
    name: true;
    channel: true;
    isActive: true;
    storeId: true;
  };
}>;

export function toPaymentResponseOnly(entity: PaymentEntityOnly) {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    isActive: entity.isActive,
    storeId: entity.storeId ? String(entity.storeId) : null,
    storeName: null,
  };
}
