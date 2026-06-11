import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Prisma, prisma, ProductionStatus, ProductionType } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import {
  toProductionOnlyResponse,
  toProductionResponse,
} from 'production/production/productions.response';
import {
  CreateProductionBeSpokeDto,
  UpdateProductionDto,
} from 'production/dto/production.dto';
import { BeSpokeRequiredSchema } from '@repo/schemas';

@Injectable()
export class ProductionService {
  async findAll(
    pagination: Pagination,
    search?: string,
    type?: ProductionType,
    status?: ProductionStatus,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const whereClause: Prisma.ProductionWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        {
          variant: {
            productMaster: {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          beSpokeDetails: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }
    const data = await prisma.production.findMany({
      skip: skip,
      take: limit,
      where: whereClause,
      orderBy: {
        status: 'asc',
      },
      select: {
        id: true,
        storeId: true,
        producedVariantId: true,
        quantityProduced: true,
        type: true,
        status: true,
        targetDate: true,
        notes: true,
        createdAt: true,
        variant: {
          select: {
            sku: true,
            productMaster: {
              select: {
                name: true,
              },
            },
          },
        },
        beSpokeDetails: {
          include: {
            customer: true,
          },
        },
      },
    });

    const total = await prisma.production.count({
      where: whereClause,
    });
    const result = data.map(toProductionResponse);
    return {
      success: true,
      data: result,
      meta: {
        skip: skip,
        limit: limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async findById(id: bigint) {
    const data = await prisma.production.findUnique({
      where: { id: id },
      include: {
        variant: {
          select: {
            sku: true,
            productMaster: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!data) throw new BadRequestException('Maaf data tidak ditemukan');

    return toProductionOnlyResponse(data);
  }

  async productionSummary() {
    const planned = await prisma.production.count({
      where: { status: 'PLANNED' },
    });

    const inProgress = await prisma.production.count({
      where: { status: 'IN_PROGRESS' },
    });

    const thisMonth = new Date();
    const startOfMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1,
    );
    const startOfNextMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      1,
    );

    const completed = await prisma.production.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    const cancelled = await prisma.production.count({
      where: {
        status: 'CANCELLED',
        createdAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
    });

    const result = {
      planned: planned ?? 0,
      inProgress: inProgress ?? 0,
      completed: completed ?? 0,
      cancelled: cancelled ?? 0,
    };

    return result;
  }

  async create(data: CreateProductionBeSpokeDto) {
    const statusMap: Record<string, ProductionStatus> = {
      PLANNED: ProductionStatus.PLANNED,
      IN_PROGRESS: ProductionStatus.IN_PROGRESS,
      COMPLETED: ProductionStatus.COMPLETED,
      CANCELLED: ProductionStatus.CANCELLED,
    };
    const status = statusMap[data.status] ?? ProductionStatus.PLANNED;

    const typeMap: Record<string, ProductionType> = {
      RESTOCK: ProductionType.RESTOCK,
      MADE_TO_ORDER: ProductionType.MADE_TO_ORDER,
      BE_SPOKE: ProductionType.BE_SPOKE,
      PRE_ORDER: ProductionType.PRE_ORDER,
    };

    const typeData = typeMap[data.type] ?? ProductionType.RESTOCK;

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const production = await tx.production.create({
        data: {
          storeId: data.storeId,
          producedVariantId: data.producedVariantId
            ? BigInt(data.producedVariantId)
            : null,
          quantityProduced: data.quantityProduced,
          status: status,
          type: typeData,
          notes: data.notes,
          targetDate: data.targetDate,
          createdAt: new Date().toISOString(),
        },
      });

      if (data.type === 'BE_SPOKE') {
        if (!data.bespoke) {
          throw new BadRequestException('Data BE SPOKE kosong harap coba lagi');
        }

        const bespoke = BeSpokeRequiredSchema.parse(data.bespoke);

        let customer;
        customer = await tx.customer.findFirst({
          where: { email: data.bespoke?.email },
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: bespoke.name,
              email: bespoke.email,
              phone: bespoke.phone,
            },
          });
        }

        await tx.beSpokeDetails.create({
          data: {
            title: bespoke.title,
            productionId: production.id,
            customerId: customer.id,
            description: bespoke.description,
            quotedPrice: bespoke.quotedPrice,
          },
        });
      }

      return toProductionOnlyResponse(production);
    });

    return toProductionOnlyResponse(transaction);
  }

  async updateProduction(id: bigint, data: CreateProductionBeSpokeDto) {
    const isExisting = await prisma.production.findUnique({
      where: { id: id },
    });

    if (!isExisting) {
      throw new BadRequestException('Maaf data tidak ditemukan');
    }

    const statusMap: Record<string, ProductionStatus> = {
      PLANNED: ProductionStatus.PLANNED,
      IN_PROGRESS: ProductionStatus.IN_PROGRESS,
      COMPLETED: ProductionStatus.COMPLETED,
      CANCELLED: ProductionStatus.CANCELLED,
    };

    const status =
      data.status && data.status in statusMap
        ? statusMap[data.status]
        : isExisting.status;

    const typeMap: Record<string, ProductionType> = {
      RESTOCK: ProductionType.RESTOCK,
      MADE_TO_ORDER: ProductionType.MADE_TO_ORDER,
      BE_SPOKE: ProductionType.BE_SPOKE,
      PRE_ORDER: ProductionType.PRE_ORDER,
    };

    const typeData = typeMap[data.type] ?? isExisting.type;

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const production = await tx.production.update({
        where: { id: id },
        data: {
          storeId: data.storeId,
          producedVariantId: data.producedVariantId
            ? BigInt(data.producedVariantId)
            : null,
          quantityProduced: data.quantityProduced,
          status: status,
          type: typeData,
          notes: data.notes,
          targetDate: data.targetDate,
          createdAt: new Date().toISOString(),
        },
      });

      const isExistingBespoke = await tx.beSpokeDetails.findUnique({
        where: { productionId: id },
      });

      if (!isExistingBespoke) {
        if (data.type === 'BE_SPOKE') {
          if (!data.bespoke) {
            throw new BadRequestException(
              'Data BE SPOKE kosong harap coba lagi',
            );
          }

          const bespoke = BeSpokeRequiredSchema.parse(data.bespoke);

          let customer;
          customer = await tx.customer.findFirst({
            where: { email: data.bespoke?.email },
          });

          if (!customer) {
            customer = await tx.customer.create({
              data: {
                name: bespoke?.name,
                email: bespoke?.email,
                phone: bespoke?.phone,
              },
            });
          }

          await tx.beSpokeDetails.create({
            data: {
              title: bespoke.title,
              productionId: production.id,
              customerId: customer.id,
              description: bespoke.description,
              quotedPrice: bespoke.quotedPrice,
            },
          });
        }

        return toProductionOnlyResponse(production);
      } else {
        if (data.type === 'BE_SPOKE') {
          if (!data.bespoke) {
            throw new BadRequestException(
              'Data BE SPOKE kosong harap coba lagi',
            );
          }

          await tx.customer.update({
            where: { id: isExistingBespoke.customerId! },
            data: {
              name: data.bespoke?.name,
              email: data.bespoke?.email,
              phone: data.bespoke?.phone,
            },
          });

          await tx.beSpokeDetails.update({
            where: { productionId: id },
            data: {
              title: data.bespoke.title,
              productionId: production.id,
              customerId: isExistingBespoke?.customerId,
              description: data.bespoke.description,
              quotedPrice: data.bespoke.quotedPrice,
            },
          });
        }
        return toProductionOnlyResponse(production);
      }
    });

    return toProductionOnlyResponse(transaction);
  }

  async updateStatusNotCompleted(id: bigint, data: UpdateProductionDto) {
    const isExisting = await prisma.production.findUnique({
      where: { id: id },
    });

    if (!isExisting) throw new HttpException('Maaf data tidak ditemukan', 404);

    const statusMap: Record<string, ProductionStatus> = {
      PLANNED: ProductionStatus.PLANNED,
      IN_PROGRESS: ProductionStatus.IN_PROGRESS,
      COMPLETED: ProductionStatus.COMPLETED,
      CANCELLED: ProductionStatus.CANCELLED,
    };

    const status =
      data.status && data.status in statusMap
        ? statusMap[data.status]
        : isExisting.status;

    if (status === 'COMPLETED') {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const result = await prisma.production.update({
      where: { id: id },
      data: {
        status: status,
      },
    });

    return toProductionOnlyResponse(result);
  }

  async updateStatusCompleted(id: bigint, data: UpdateProductionDto) {
    const isExisting = await prisma.production.findUnique({
      where: { id: id },
    });

    if (!isExisting) throw new HttpException('Maaf data tidak ditemukan', 404);

    if (isExisting.status === 'COMPLETED') {
      throw new BadRequestException(
        'Maaf, pekerjaan produksi ini sudah selesai dijalankan.',
      );
    }

    if (isExisting.status === 'CANCELLED') {
      throw new BadRequestException(
        'Maaf, pekerjaan produksi yang sudah dibatalkan tidak bisa diselesaikan.',
      );
    }

    const statusMap: Record<string, ProductionStatus> = {
      PLANNED: ProductionStatus.PLANNED,
      IN_PROGRESS: ProductionStatus.IN_PROGRESS,
      COMPLETED: ProductionStatus.COMPLETED,
      CANCELLED: ProductionStatus.CANCELLED,
    };

    const status =
      data.status && data.status in statusMap
        ? statusMap[data.status]
        : isExisting.status;

    if (status !== 'COMPLETED') {
      throw new BadRequestException(
        'Maaf, fungsi ini hanya menerima perubahan status ke COMPLETED',
      );
    }

    const transaksi = await prisma.$transaction(async (tx) => {
      if (isExisting.producedVariantId) {
        await tx.productVariantStock.upsert({
          where: {
            productVariantId: isExisting.producedVariantId,
          },
          update: {
            stock: {
              increment: isExisting.quantityProduced,
            },
          },
          create: {
            productVariantId: isExisting.producedVariantId,
            stock: isExisting.quantityProduced,
            reserved_stock: 0,
          },
          select: {
            id: true,
            stock: true,
            reserved_stock: true,
          },
        });

        await tx.inventoryLedger.create({
          data: {
            storeId: isExisting.storeId,
            itemType: 'PRODUCT_VARIANT',
            itemId: isExisting.producedVariantId,
            direction: 'IN',
            quantity: isExisting.quantityProduced,
            source: 'PRODUCTION',
            referenceId: isExisting.id,
          },
        });
      }

      const result = await tx.production.update({
        where: { id: id },
        data: {
          status: status,
        },
      });

      return result;
    });

    return transaksi;
  }

  async remove(id: bigint) {
    const data = await prisma.production.delete({
      where: { id: id },
    });

    return toProductionOnlyResponse(data);
  }
}
