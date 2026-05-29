import { BadGatewayException, Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { CategoriesDto } from 'categories/dto/categories.dto';
import { toCategoriesResponse } from './categories.response';

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

    const result = data.map((item) => ({
      ...toCategoriesResponse(item),
      productCount: item._count.productMasters,
    }));

    return {
      success: true,
      data: result,
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
      },
    });

    return data;
  }

  async getCategoriesSummary() {
    const totalCategories = await prisma.categories.count();
    const activeCategories = await prisma.categories.count({
      where: {
        status: true,
      },
    });
    const linkedProducts = await prisma.categories.count({
      where: {
        productMasters: {
          some: {},
        },
      },
    });

    const data = {
      totalCategories,
      activeCategories,
      linkedProducts,
    };

    return {
      success: true,
      data,
      meta: {
        timeStamp: new Date().toISOString(),
      },
    };
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

    return toCategoriesResponse(res);
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

    return toCategoriesResponse(res);
  }

  async delete(id: bigint) {
    await this.findOne(id);

    const res = await prisma.categories.delete({
      where: { id },
    });

    return toCategoriesResponse(res);
  }
}
