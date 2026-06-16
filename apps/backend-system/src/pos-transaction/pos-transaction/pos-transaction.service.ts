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
      include: {
        items: {
          select: {
            productVariantId: true,
            quantity: true,
            price: true,
            variant: {
              select: {
                productMaster: {
                  select: {
                    name: true,
                  },
                },
                options: {
                  select: {
                    variantValue: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const result = res.map((r) => {
      return {
        transId: r.transId,
        status: r.status,
        itemTransaction: r.items.map((it) => {
          const variantOpt = it.variant.options
            .map((vo) => vo.variantValue.value)
            .join(' - ');
          return {
            productVariantId: it.productVariantId,
            price: it.price,
            qty: it.quantity,
            itemTransactionName: it.variant.productMaster.name,
            itemTransactionVariantOpt: variantOpt,
          };
        }),
      };
    });

    return result;
  }

  async paidOperation(
    data: CreatePosTransactionDto,
    posTx: bigint,
    tx: Prisma.TransactionClient,
  ) {
    await tx.inventoryLedger.createMany({
      data: data.itemTransaction.map((item) => ({
        itemType: 'PRODUCT_VARIANT',
        itemId: BigInt(item.productVariantId),
        source: 'POS',
        referenceId: BigInt(posTx),
        direction: 'OUT',
        quantity: item.quantity,
        storeId: BigInt(data.storeId),
      })),
    });

    for (const items of data.itemTransaction) {
      await tx.productVariantStock.update({
        where: {
          productVariantId: BigInt(items.productVariantId),
        },
        data: {
          stock: {
            decrement: items.quantity,
          },
          reserved_stock: {
            increment: items.quantity,
          },
        },
      });
    }
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
      PENDING: PosStatus.PENDING,
      PARKED: PosStatus.PARKED,
      PAID: PosStatus.PAID,
      CANCELLED: PosStatus.CANCELLED,
    };

    const status = statusMap[data.status] ?? PosStatus.PENDING;

    if (data.itemTransaction.length === 0)
      throw new BadRequestException(
        'Item transaksi kosong, tidak bisa melakukan transaksi',
      );

    const transaction = await prisma.$transaction(async (tx) => {
      const totalAmount = data.itemTransaction.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );

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
            totalAmount: totalAmount,
            status: status,
            items: {
              create: data.itemTransaction.map((item) => ({
                productVariantId: BigInt(item.productVariantId),
                quantity: item.quantity,
                price: item.price,
                subtotal: item.price * item.quantity,
              })),
            },
          },
        });

        if (status === 'PAID') await this.paidOperation(data, posTx.id, tx);

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
            totalAmount: totalAmount,
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
                subtotal: item.price * item.quantity,
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
                subtotal: item.price * item.quantity,
              },
            });
          }
        }

        if (status === 'PAID') await this.paidOperation(data, posTx.id, tx);
        return posTx;
      }
    });

    return transaction;
  }

  async cancelTransaction(transactionId: string[]) {
    return prisma.posTransaction.updateMany({
      where: {
        transId: {
          in: transactionId,
        },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }
}
