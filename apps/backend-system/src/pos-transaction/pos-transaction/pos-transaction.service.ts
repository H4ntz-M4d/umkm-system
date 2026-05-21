import { BadRequestException, Injectable } from '@nestjs/common';
import { PosStatus, Prisma, prisma } from '@repo/db';
import { idFormat } from 'common/helpers/id-format';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { toPosTransactionResponse } from './pos-transaction.response';
import { Pagination } from 'common/paginate/pagination';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';

@Injectable()
export class PosTransactionService {
  async findMany(
    pagination: Pagination,
    search?: string,
    paymentChannel?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const whereClause: Prisma.PosTransactionWhereInput = {
      paymentMethod: {
        channel: paymentChannel
          ? (paymentChannel as Prisma.EnumPaymentChannelFilter)
          : undefined,
        name: search
          ? {
              contains: search,
              mode: 'insensitive',
            }
          : undefined,
      },
      users: {
        employees: {
          name: search
            ? {
                contains: search,
                mode: 'insensitive',
              }
            : undefined,
        },
      },
      transId: search
        ? {
            contains: search,
            mode: 'insensitive',
          }
        : undefined,
      createdAt: {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      },
    };

    const data = await prisma.posTransaction.findMany({
      where: whereClause,
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
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
        paymentMethod: {
          select: {
            name: true,
            channel: true,
          },
        },
        users: {
          select: {
            employees: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.posTransaction.count({
      where: whereClause,
    });

    const result = data.map(toPosTransactionResponse);

    return {
      success: true,
      data: result,
      meta: {
        skip: pagination.skip ?? 0,
        limit: pagination.limit ?? 10,
        total: total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async findManyByParked() {
    const res = await prisma.posTransaction.findMany({
      where: {
        status: PosStatus.PARKED,
      },
    });

    return res;
  }

  async upsert(data: CreatePosTransactionDto) {
    const stocks = await prisma.productVariantStock.findMany({
      where: {
        productVariantId: {
          in: data.itemTransaction.map((item) => BigInt(item.productVariantId)),
        },
      },
      select: {
        productVariantId: true,
        stock: true,
        reserved_stock: true,
        productVariant: {
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
    });

    for (const dataStock of data.itemTransaction) {
      const itemStock = stocks.find(
        (stock) =>
          stock.productVariantId === BigInt(dataStock.productVariantId),
      );

      console.log(itemStock);

      if (itemStock && itemStock.stock < dataStock.quantity) {
        const variantNames = itemStock.productVariant.options
          .map((opt) => opt.variantValue.value)
          .join(' - ');

        throw new BadRequestException(
          `Maaf stock dari ${itemStock.productVariant.productMaster.name} variant ${variantNames} tidak mencukupi`,
        );
      }
    }

    const statusMap: Record<string, PosStatus> = {
      DRAFT: PosStatus.DRAFT,
      PARKED: PosStatus.PARKED,
      PAID: PosStatus.PAID,
      CANCELLED: PosStatus.CANCELLED,
    };

    const status = statusMap[data.status] ?? PosStatus.DRAFT;

    const transaction = await prisma.$transaction(async (tx) => {
      if (!data.transId) {
        const transId = idFormat('POS');
        const posTx = await tx.posTransaction.create({
          data: {
            transId: transId,
            storeId: BigInt(data.storeId),
            cashierId: BigInt(data.cashierId),
            paymentMethodId: data.paymentMethodId
              ? BigInt(data.paymentMethodId)
              : null,
            totalAmount: data.totalAmount,
            status: status,
            items: {
              create: data.itemTransaction.map((item) => ({
                productVariantId: BigInt(item.productVariantId),
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              })),
            },
          },
        });

        return posTx;
      } else {
        const posTx = await tx.posTransaction.update({
          where: {
            transId: data.transId,
          },
          data: {
            storeId: BigInt(data.storeId),
            cashierId: BigInt(data.cashierId),
            paymentMethodId: data.paymentMethodId
              ? BigInt(data.paymentMethodId)
              : null,
            totalAmount: data.totalAmount,
            status: status,
          },
        });

        if (data.itemTransaction.length > 0) {
          const existingItems = await tx.posTransactionItem.findMany({
            where: {
              posTransactionId: posTx.id,
            },
          });

          const existingVariantIds = existingItems.map(
            (item) => item.productVariantId,
          );
          const incomingVariants = data.itemTransaction.map((item) =>
            BigInt(item.productVariantId),
          );

          const variantsToDelete = existingVariantIds.filter(
            (id) => !incomingVariants.includes(id),
          );
          if (variantsToDelete.length > 0) {
            await tx.posTransactionItem.deleteMany({
              where: {
                posTransactionId: posTx.id,
                productVariantId: { in: variantsToDelete },
              },
            });
          }

          const itemsToCreate = data.itemTransaction.filter(
            (item) =>
              !existingVariantIds.includes(BigInt(item.productVariantId)),
          );
          if (itemsToCreate.length > 0) {
            await tx.posTransactionItem.createMany({
              data: itemsToCreate.map((item) => ({
                posTransactionId: posTx.id,
                productVariantId: BigInt(item.productVariantId),
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              })),
            });
          }

          const itemsToUpdate = data.itemTransaction.filter((item) =>
            existingVariantIds.includes(BigInt(item.productVariantId)),
          );
          for (const item of itemsToUpdate) {
            await tx.posTransactionItem.updateMany({
              where: {
                posTransactionId: posTx.id,
                productVariantId: BigInt(item.productVariantId),
              },
              data: {
                quantity: item.quantity,
                price: item.price,
                subtotal: item.subtotal,
              },
            });
          }
        }

        return posTx;
      }
    });

    return transaction;
  }
}
