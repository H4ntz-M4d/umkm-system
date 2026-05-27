import { BadGatewayException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CategoriesDto } from 'categories/dto/categories.dto';

@Injectable()
export class CategoriesService {
  async findAll(search?: string) {
    const data = await prisma.categories.findMany({
      where: {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        slug: true,
        _count: {
          select: {
            productMasters: true,
          },
        },
      },
    });

    return {
      success: true,
      data: data,
      meta: {
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async getListCategories() {
    const data = await prisma.categories.findMany({
      where: {
        status: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        slug: true,
        _count: {
          select: {
            productMasters: true,
          },
        },
      },
    });

    return data;
  }

  async create(data: CategoriesDto) {
    const res = await prisma.categories.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        slug: data.slug,
      },
    });

    return res;
  }

  async findOne(id: bigint) {
    const res = await prisma.categories.findUnique({
      where: {
        id: id,
      },
    });

    if (!res) {
      throw new BadGatewayException('Category not found');
    }

    return res;
  }

  async update(id: bigint, data: CategoriesDto) {
    await this.findOne(id);

    const res = await prisma.categories.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        slug: data.slug,
      },
    });

    return res;
  }

  async delete(id: bigint) {
    await this.findOne(id);

    const res = await prisma.categories.delete({
      where: { id },
    });

    return res;
  }
}
