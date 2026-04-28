import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { prisma, ProductionStatus } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import {
  toProductionOnlyResponse,
  toProductionResponse,
} from 'production/production/productions.response';
import {
  CreateProductionDto,
  UpdateProductionDto,
} from 'production/dto/production.dto';

@Injectable()
export class ProductionService {
  async findAll(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.production.findMany({
      skip: skip,
      take: limit,
      where: {
        variant: {
          productMaster: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      },
      select: {
        id: true,
        storeId: true,
        producedVariantId: true,
        quantityProduced: true,
        status: true,
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
        materials: {
          select: {
            id: true,
            productionId: true,
            rawMaterialId: true,
            quantityUsed: true,
            rawMaterial: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    const total = await prisma.production.count();
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

  async create(data: CreateProductionDto) {
    const statusMap: Record<string, ProductionStatus> = {
      PLANNED: ProductionStatus.PLANNED,
      IN_PROGRESS: ProductionStatus.IN_PROGRESS,
      COMPLETED: ProductionStatus.COMPLETED,
      CANCELLED: ProductionStatus.CANCELLED,
    };
    const status = statusMap[data.status] ?? ProductionStatus.PLANNED;

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const production = await prisma.production.create({
      data: {
        storeId: data.storeId,
        producedVariantId: data.producedVariantId,
        quantityProduced: data.quantityProduced,
        status: status,
        createdAt: new Date().toISOString(),
        materials: {
          create: data.materials.map((material) => ({
            rawMaterialId: material.rawMaterialId,
            quantityUsed: material.quantityUsed,
          })),
        },
      },
    });

    return toProductionOnlyResponse(production);
  }

  async updateProduction(id: bigint, data: CreateProductionDto) {
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

    if (status === 'COMPLETED' || status === 'CANCELLED') {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const production = await prisma.production.update({
      where: { id: id },
      data: {
        storeId: data.storeId,
        producedVariantId: data.producedVariantId,
        quantityProduced: data.quantityProduced,
        status: status,
        materials:
          data.materials !== undefined
            ? {
                deleteMany: {},
                create: data.materials.map((material) => ({
                  rawMaterialId: material.rawMaterialId,
                  quantityUsed: material.quantityUsed,
                })),
              }
            : undefined,
      },
    });

    return toProductionOnlyResponse(production);
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
      include: {
        materials: true,
      },
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

    if (
      status === 'PLANNED' ||
      status === 'IN_PROGRESS' ||
      status === 'CANCELLED'
    ) {
      throw new BadRequestException('Maaf status tidak valid');
    }

    const transaksi = await prisma.$transaction(async (tx) => {
      const materialIds = isExisting.materials.map((m) => m.rawMaterialId);
      const materialStocks = await tx.rawMaterialStock.findMany({
        where: {
          rawMaterialId: {
            in: materialIds,
          },
        },
      });

      const stockMaterials = new Map(
        materialStocks.map((m) => [m.rawMaterialId, m]),
      );

      for (const materialStock of isExisting.materials) {
        const stocks = stockMaterials.get(materialStock.rawMaterialId);
        if (!stocks || stocks.stock < materialStock.quantityUsed) {
          throw new BadRequestException(
            'Maaf stok dari bahan baku tidak mencukupi untuk digunakan',
          );
        }
      }

      for (const material of isExisting.materials) {
        const updated = await tx.rawMaterialStock.updateMany({
          where: {
            rawMaterialId: material.rawMaterialId,
            stock: {
              gte: material.quantityUsed,
            },
          },
          data: {
            stock: {
              decrement: material.quantityUsed,
            },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            'Konflik stok (race condition), silahkan ulangi',
          );
        }
      }

      await tx.inventoryLedger.createMany({
        data: isExisting.materials.map((material) => ({
          storeId: isExisting.storeId,
          itemType: 'RAW_MATERIAL',
          itemId: material.rawMaterialId,
          direction: 'OUT',
          quantity: material.quantityUsed,
          source: 'PRODUCTION',
          referenceId: isExisting.id,
        })),
      });

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
          available_stock: isExisting.quantityProduced,
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
