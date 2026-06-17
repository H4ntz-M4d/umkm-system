import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { BankAccountSchema } from '@repo/schemas';
import { PaymentMethodDto } from 'payment/payment.dto';
import { toPaymentResponse, toPaymentResponseOnly } from './payment.response';

@Injectable()
export class PaymentService {
  async findAll() {
    const data = await prisma.paymentMethod.findMany({
      include: { bankAccount: true },
    });
    return data.map(toPaymentResponse);
  }

  async create(data: PaymentMethodDto) {
    const payment = await prisma.paymentMethod.create({
      data: {
        name: data.name,
        channel: data.channel,
        isActive: data.isActive,
      },
    });

    if (data.channel === 'BANK_TRANSFER') {
      const bankData = BankAccountSchema.parse(data.bankAccount);
      await prisma.bankAccount.create({
        data: {
          paymentMethodId: payment.id,
          bankName: payment.name,
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
        },
      });
    }

    return toPaymentResponseOnly(payment);
  }

  async update(id: bigint, data: PaymentMethodDto) {
    const payment = await prisma.paymentMethod.update({
      where: { id },
      data: {
        name: data.name,
        channel: data.channel,
        isActive: data.isActive,
      },
    });

    if (data.channel === 'BANK_TRANSFER') {
      const bankData = BankAccountSchema.parse(data.bankAccount);
      await prisma.bankAccount.update({
        where: { paymentMethodId: id },
        data: {
          paymentMethodId: payment.id,
          bankName: payment.name,
          accountName: bankData.accountName,
          accountNumber: bankData.accountNumber,
        },
      });
    }

    return toPaymentResponseOnly(payment);
  }

  async remove(id: bigint) {
    const payment = await prisma.paymentMethod.delete({ where: { id } });
    return toPaymentResponseOnly(payment);
  }
}
