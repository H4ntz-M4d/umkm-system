import { BadRequestException, Injectable } from '@nestjs/common';
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

  async updateProduction(id: bigint, data: UpdateProductionDto) {
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

  async remove(id: bigint) {
    const data = await prisma.production.delete({
      where: { id: id },
    });

    return toProductionOnlyResponse(data);
  }
}
