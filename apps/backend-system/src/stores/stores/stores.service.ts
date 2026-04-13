import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { CreateStoreDto, UpdateStoreDto } from 'stores/dto/dto.store';
import {
  toSimpleStoresResponse,
  toStoresResponse,
} from 'stores/stores/stores.response';

@Injectable()
export class StoresService {
  async findAll(pagination: Pagination) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const data = await prisma.store.findMany({
      skip,
      take: limit ?? 10,
    });
    const total = await prisma.store.count();

    data.map(toStoresResponse);
    return {
      success: true,
      data,
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async findAllStore() {
    const data = await prisma.store.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    return data.map(toSimpleStoresResponse);
  }

  async create(data: CreateStoreDto) {
    const store = await prisma.store.create({
      data: data,
    });

    return toStoresResponse(store);
  }

  async update(id: bigint, data: UpdateStoreDto) {
    const store = await prisma.store.update({
      where: {
        id: id,
      },
      data: data,
    });

    return toStoresResponse(store);
  }

  async remove(store_id: number) {
    const store = await prisma.store.delete({
      where: {
        id: store_id,
      },
    });

    return toStoresResponse(store);
  }
}
