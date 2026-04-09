import { BadRequestException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { toMaterialsResponse } from 'material/materials/materials.response';
import {
  CreateMaterialsDto,
  UpdateMaterialsDto,
} from 'material/dto/materials.dto';

@Injectable()
export class MaterialsService {
  async findAll(pagination: Pagination, search?: string) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.rawMaterial.findMany({
      skip: skip,
      take: limit ?? 10,
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    const total = await prisma.rawMaterial.count();
    const result = data.map(toMaterialsResponse);
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
    const data = await prisma.rawMaterial.findUnique({
      where: { id: id },
    });

    if (!data) {
      throw new BadRequestException('Maaf data tidak di temukan');
    }

    return toMaterialsResponse(data);
  }

  async create(data: CreateMaterialsDto) {
    const material = await prisma.rawMaterial.create({ data });
    return toMaterialsResponse(material);
  }

  async update(id: bigint, data: UpdateMaterialsDto) {
    const material = await prisma.rawMaterial.update({
      where: { id: id },
      data,
    });

    return toMaterialsResponse(material);
  }

  async remove(id: bigint) {
    const material = await prisma.rawMaterial.delete({
      where: { id: id },
    });
    return toMaterialsResponse(material);
  }
}
