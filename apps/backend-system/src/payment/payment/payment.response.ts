import { Prisma } from '@repo/db';

type PaymentEntity = Prisma.PaymentMethodGetPayload<{
  include: {
    bankAccount: true;
  };
}>;

export function toPaymentResponse(entity: PaymentEntity) {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    isActive: entity.isActive,
    bankName: entity.bankAccount?.bankName,
    accountName: entity.bankAccount?.accountName,
    accountNumber: entity.bankAccount?.accountNumber,
  };
}

type PaymentEntityOnly = Prisma.PaymentMethodGetPayload<{
  select: {
    id: true;
    name: true;
    channel: true;
    isActive: true;
  };
}>;

export function toPaymentResponseOnly(entity: PaymentEntityOnly) {
  return {
    id: entity.id,
    name: entity.name,
    channel: entity.channel,
    isActive: entity.isActive,
  };
}
