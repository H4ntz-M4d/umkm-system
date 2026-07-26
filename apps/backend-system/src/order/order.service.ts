import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, prisma } from '@repo/db';
import { OrderData, z } from '@repo/schemas';
import { OrderQueryDto } from 'order/dto/order.dto';
import { toOrderResponse } from './order.response';

@Injectable()
export class OrderService {
  async findAll(query: OrderQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;

    const whereClause: Prisma.OrderWhereInput = {
      ...(query.store && {
        storeId: BigInt(query.store),
      }),
      ...(query.status && {
        status: OrderStatus[query.status],
      }),
      ...(query.search && {
        OR: [
          {
            orderId: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
          {
            customer: {
              name: {
                contains: query.search,
                mode: 'insensitive',
              },
            },
          },
        ],
      }),
    };

    const data = await prisma.order.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        store: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
        payment: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            variant: {
              select: {
                productMaster: {
                  select: {
                    name: true,
                  },
                },
                options: {
                  select: {
                    variantValue: {
                      select: {
                        value: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        shipment: true,
      },
    });

    const total = await prisma.order.count({
      where: whereClause,
    });

    const result = z.array(OrderData).parse(data.map(toOrderResponse));

    return {
      success: true,
      data: result,
      meta: {
        skip: skip,
        limit: limit,
        total: total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async cancel(orderId: string[]) {
    return prisma.order.updateMany({
      where: {
        orderId: { in: orderId },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  async getTotalAmount() {
    const now = new Date();
    const dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const totalAmount = await prisma.order.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: dateFrom,
          lt: dateTo,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    const total = await prisma.order.count();
    const result = {
      totalAmount: totalAmount._sum.totalAmount ?? 0,
      totalOrder: total,
    };
    return result;
  }
}
