import { Injectable } from '@nestjs/common';
import { prisma, Prisma } from '@repo/db';
import { TransactionFlowData, TransactionFlowSummary, z } from '@repo/schemas';

@Injectable()
export class TransactionFlowService {
  async findAll(params: {
    type?: string;
    source?: string;
    skip?: number;
    take?: number;
    storeId?: string;
  }) {
    const dynamicFilters = [
      params.type && { type: params.type },
      params.source && { source: params.source },
      params.storeId && { storeId: BigInt(params.storeId) },
    ].filter(Boolean) as Prisma.CashTransactionWhereInput[];

    const data = await prisma.cashTransaction.findMany({
      skip: params.skip ?? 0,
      take: params.take ?? 10,
      where: {
        ...(dynamicFilters.length > 0 && { AND: dynamicFilters }),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.cashTransaction.count({
      where: {
        ...(dynamicFilters.length > 0 && { AND: dynamicFilters }),
      },
    });

    const formatedData = data.map((item) => ({
      ...item,
      storeName: item.store.name,
    }));
    const result = z.array(TransactionFlowData).parse(formatedData);

    return {
      success: true,
      data: result,
      meta: {
        skip: params.skip ?? 0,
        limit: params.take ?? 10,
        total: total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async summaryTransaction() {
    const typeTransaction = await prisma.cashTransaction.groupBy({
      by: ['type'],
      _sum: {
        amount: true,
      },
    });

    const transactionIn = Number(
      typeTransaction.find((data) => data.type === 'IN')?._sum.amount ?? 0,
    );
    const transactionOut = Number(
      typeTransaction.find((data) => data.type === 'OUT')?._sum.amount ?? 0,
    );
    const netTransaction = transactionIn - transactionOut;

    const result = TransactionFlowSummary.parse({
      transactionIn,
      transactionOut,
      netTransaction,
    });

    return result;
  }
}
