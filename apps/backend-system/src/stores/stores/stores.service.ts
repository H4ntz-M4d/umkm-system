import { Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
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

  /**
   * Hanya boleh ada satu toko sumber penjualan online.
   *
   * Penandanya dipindahkan, bukan ditolak: menandai toko baru berarti mencabut
   * tanda dari toko lama dalam satu transaksi. Kalau sekadar ditolak, admin
   * harus mematikan yang lama dulu — dan di antara dua langkah itu sistem
   * sempat tidak punya sumber online sama sekali, yang membuat checkout gagal.
   *
   * Database tetap menjaga aturannya lewat partial unique index; ini yang
   * membuat jalur normal tidak pernah sampai menabraknya.
   */
  private async clearOtherOnlineSource(
    tx: Prisma.TransactionClient,
    exceptId?: bigint,
  ) {
    await tx.store.updateMany({
      where: {
        isOnlineSource: true,
        ...(exceptId && { id: { not: exceptId } }),
      },
      data: { isOnlineSource: false },
    });
  }

  async create(data: CreateStoreDto) {
    const store = await prisma.$transaction(async (tx) => {
      if (data.isOnlineSource) await this.clearOtherOnlineSource(tx);

      return tx.store.create({ data });
    });

    return toStoresResponse(store);
  }

  async update(id: bigint, data: UpdateStoreDto) {
    const store = await prisma.$transaction(async (tx) => {
      if (data.isOnlineSource) await this.clearOtherOnlineSource(tx, id);

      return tx.store.update({ where: { id }, data });
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
