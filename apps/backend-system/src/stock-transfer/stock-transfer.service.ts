import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import type {
  CreateStockTransferInput,
  StockTransferQueryInput,
} from '@repo/schemas';
import { idFormat } from 'common/helpers/id-format';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { findProductionHouse } from 'common/helpers/online-store';
import {
  toStockTransferResponse,
  transferInclude,
} from './stock-transfer.response';

@Injectable()
export class StockTransferService {
  /// Dipakai bersama listing dan penghitung total, supaya keduanya tidak
  /// mungkin menyaring berbeda.
  private buildWhere(
    query: StockTransferQueryInput,
  ): Prisma.StockTransferWhereInput {
    return {
      ...(query.status && { status: query.status }),
      ...(query.toStoreId && { toStoreId: BigInt(query.toStoreId) }),
      ...(query.search && {
        code: { contains: query.search, mode: 'insensitive' },
      }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          gte: query.dateFrom ? toStartOfDay(query.dateFrom) : undefined,
          lte: query.dateTo ? toEndOfDay(query.dateTo) : undefined,
        },
      }),
    };
  }

  async findAll(query: StockTransferQueryInput) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: transferInclude,
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toStockTransferResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async create(data: CreateStockTransferInput) {
    const from = await findProductionHouse();
    const toStoreId = BigInt(data.toStoreId);

    if (from.id === toStoreId) {
      throw new BadRequestException(
        'Toko tujuan tidak boleh sama dengan rumah produksi.',
      );
    }

    const toStore = await prisma.store.findFirst({
      where: { id: toStoreId, isActive: true },
      select: { id: true },
    });

    if (!toStore) {
      throw new BadRequestException(
        'Toko tujuan tidak ditemukan atau nonaktif.',
      );
    }

    const transfer = await prisma.stockTransfer.create({
      data: {
        code: idFormat('TRF'),
        fromStoreId: from.id,
        toStoreId,
        notes: data.notes ?? null,
        items: {
          create: data.items.map((item) => ({
            productVariantId: BigInt(item.productVariantId),
            quantity: item.quantity,
          })),
        },
      },
      include: transferInclude,
    });

    return {
      success: true,
      data: toStockTransferResponse(transfer),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Memindahkan status secara atomik.
   *
   * Memakai `updateMany` berkondisi status alih-alih baca-lalu-tulis: dua
   * permintaan yang tiba bersamaan tidak bisa sama-sama lolos, karena yang kedua
   * akan mendapati `count` nol. Pola baca-dulu akan meloloskan keduanya dan
   * menggerakkan stok dua kali — kesalahan yang di stok tidak pernah ketahuan
   * karena angkanya tetap terlihat wajar.
   */
  private async moveStatus(
    tx: Prisma.TransactionClient,
    id: bigint,
    from: 'READY' | 'SENT',
    to: 'SENT' | 'RECEIVED' | 'CANCELLED',
    timestampField?: 'sentAt' | 'receivedAt',
  ) {
    const moved = await tx.stockTransfer.updateMany({
      where: { id, status: from },
      data: {
        status: to,
        ...(timestampField && { [timestampField]: new Date() }),
      },
    });

    if (moved.count === 0) {
      throw new BadRequestException(
        'Status kiriman sudah berubah. Muat ulang halaman untuk melihat keadaan terbaru.',
      );
    }
  }

  private async loadTransfer(id: bigint) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: transferInclude,
    });

    if (!transfer) throw new BadRequestException('Kiriman tidak ditemukan.');

    return transfer;
  }

  /**
   * Barang berangkat: stok keluar dari asal, belum masuk ke tujuan.
   *
   * Jeda inilah inti fiturnya — selama barang di jalan, stoknya tidak berada di
   * toko mana pun, sehingga kasir tujuan tidak bisa menjual barang yang secara
   * fisik belum sampai.
   */
  async send(id: bigint) {
    const transfer = await this.loadTransfer(id);

    if (transfer.status !== 'READY') {
      throw new BadRequestException(
        'Hanya kiriman berstatus siap kirim yang bisa dikirim.',
      );
    }

    const stocks = await prisma.productVariantStock.findMany({
      where: {
        storeId: transfer.fromStoreId,
        productVariantId: {
          in: transfer.items.map((item) => item.productVariantId),
        },
      },
      select: { productVariantId: true, stock: true },
    });

    /// Diperiksa lebih dulu supaya seluruh kekurangan dilaporkan sekaligus,
    /// bukan satu per satu tiap kali admin menekan tombol.
    const shortages = transfer.items
      .map((item) => {
        const available =
          stocks.find((s) => s.productVariantId === item.productVariantId)
            ?.stock ?? 0;

        return available < item.quantity
          ? `${item.variant.productMaster.name} (${item.variant.sku}): diminta ${item.quantity}, tersedia ${available}`
          : null;
      })
      .filter(Boolean);

    if (shortages.length > 0) {
      throw new BadRequestException(
        `Stok rumah produksi tidak mencukupi. ${shortages.join('; ')}`,
      );
    }

    await prisma.$transaction(async (tx) => {
      await this.moveStatus(tx, id, 'READY', 'SENT', 'sentAt');

      for (const item of transfer.items) {
        await tx.productVariantStock.update({
          where: {
            productVariantId_storeId: {
              productVariantId: item.productVariantId,
              storeId: transfer.fromStoreId,
            },
          },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.inventoryLedger.createMany({
        data: transfer.items.map((item) => ({
          storeId: transfer.fromStoreId,
          itemType: 'PRODUCT_VARIANT' as const,
          itemId: item.productVariantId,
          direction: 'OUT' as const,
          source: 'TRANSFER' as const,
          quantity: item.quantity,
          referenceId: transfer.id,
        })),
      });
    });

    return {
      success: true,
      data: toStockTransferResponse(await this.loadTransfer(id)),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Barang sampai: stok masuk ke tujuan.
   *
   * `upsert` dipakai karena toko tujuan bisa saja belum pernah memegang varian
   * ini — barisnya baru lahir saat kiriman pertama diterima.
   */
  async receive(id: bigint) {
    const transfer = await this.loadTransfer(id);

    if (transfer.status !== 'SENT') {
      throw new BadRequestException(
        'Hanya kiriman yang sudah dikirim yang bisa dikonfirmasi diterima.',
      );
    }

    await prisma.$transaction(async (tx) => {
      await this.moveStatus(tx, id, 'SENT', 'RECEIVED', 'receivedAt');

      for (const item of transfer.items) {
        await tx.productVariantStock.upsert({
          where: {
            productVariantId_storeId: {
              productVariantId: item.productVariantId,
              storeId: transfer.toStoreId,
            },
          },
          update: { stock: { increment: item.quantity } },
          create: {
            productVariantId: item.productVariantId,
            storeId: transfer.toStoreId,
            stock: item.quantity,
            reserved_stock: 0,
          },
        });
      }

      await tx.inventoryLedger.createMany({
        data: transfer.items.map((item) => ({
          storeId: transfer.toStoreId,
          itemType: 'PRODUCT_VARIANT' as const,
          itemId: item.productVariantId,
          direction: 'IN' as const,
          source: 'TRANSFER' as const,
          quantity: item.quantity,
          referenceId: transfer.id,
        })),
      });
    });

    return {
      success: true,
      data: toStockTransferResponse(await this.loadTransfer(id)),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /// Hanya selagi barang belum berangkat. Setelah dikirim, stok sudah bergerak
  /// dan pembatalan menuntut pengembalian fisik — itu urusan penyesuaian stok,
  /// bukan pembatalan kiriman.
  async cancel(id: bigint) {
    await prisma.$transaction((tx) =>
      this.moveStatus(tx, id, 'READY', 'CANCELLED'),
    );

    return {
      success: true,
      data: toStockTransferResponse(await this.loadTransfer(id)),
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
