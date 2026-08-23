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
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';
import { findProductionHouse } from 'common/helpers/online-store';
import { idFormat } from 'common/helpers/id-format';

@Injectable()
export class ProductionService {
  /// Dipakai bersama listing dan ekspor, supaya berkas Excel tidak mungkin
  /// menyaring berbeda dari yang tampil di layar.
  private buildWhere(
    search?: string,
    type?: ProductionType,
    status?: ProductionStatus,
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.ProductionWhereInput {
    const whereClause: Prisma.ProductionWhereInput = {};

    if (status) {
      whereClause.status = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      };
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

    return whereClause;
  }

  async findAll(
    pagination: Pagination,
    search?: string,
    type?: ProductionType,
    status?: ProductionStatus,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;
    const whereClause = this.buildWhere(search, type, status, dateFrom, dateTo);

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
        store: { select: { name: true } },
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
          storeId: BigInt(data.storeId),
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
          storeId: BigInt(data.storeId),
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
      /**
       * Perpindahan status dilakukan lebih dulu dan secara berkondisi.
       *
       * Pengecekan di atas dibaca sebelum transaksi dibuka, sehingga dua
       * permintaan yang tiba bersamaan bisa sama-sama lolos dan menambah stok
       * dua kali. `updateMany` berkondisi status menutup celah itu: yang kedua
       * mendapati `count` nol dan seluruh transaksinya dibatalkan sebelum
       * menyentuh stok.
       */
      const claimed = await tx.production.updateMany({
        where: { id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        data: { status },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(
          'Status produksi sudah berubah. Muat ulang halaman untuk melihat keadaan terbaru.',
        );
      }

      if (isExisting.producedVariantId) {
        /**
         * Hasil produksi mendarat di **rumah produksi**, bukan di toko yang
         * tertulis pada produksinya.
         *
         * `Production.storeId` menyatakan produksi ini untuk toko mana —
         * sebuah tujuan, bukan tempat barangnya berada. Barang yang baru
         * selesai dirajut secara fisik ada di rumah produksi dan belum
         * dikirim; menaruhnya langsung di stok cabang akan membuat kasir di
         * sana bisa menjual barang yang belum tiba.
         */
        const productionHouse = await findProductionHouse(tx);

        await tx.productVariantStock.upsert({
          where: {
            productVariantId_storeId: {
              productVariantId: isExisting.producedVariantId,
              storeId: productionHouse.id,
            },
          },
          update: {
            stock: {
              increment: isExisting.quantityProduced,
            },
          },
          create: {
            productVariantId: isExisting.producedVariantId,
            storeId: productionHouse.id,
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
            storeId: productionHouse.id,
            itemType: 'PRODUCT_VARIANT',
            itemId: isExisting.producedVariantId,
            direction: 'IN',
            quantity: isExisting.quantityProduced,
            source: 'PRODUCTION',
            referenceId: isExisting.id,
          },
        });

        /**
         * Produksi yang ditujukan untuk toko lain langsung melahirkan catatan
         * kiriman berstatus siap kirim.
         *
         * Menyambungkan keduanya di sini, bukan menyerahkannya pada ingatan
         * admin, supaya tidak ada produksi yang selesai lalu terlupa dikirim.
         * `productionId` yang unik menjamin satu produksi tidak pernah
         * melahirkan dua kiriman.
         */
        if (isExisting.storeId !== productionHouse.id) {
          await tx.stockTransfer.create({
            data: {
              code: idFormat('TRF'),
              fromStoreId: productionHouse.id,
              toStoreId: isExisting.storeId,
              productionId: isExisting.id,
              notes: `Dibuat otomatis dari produksi #${isExisting.id}`,
              items: {
                create: {
                  productVariantId: isExisting.producedVariantId,
                  quantity: isExisting.quantityProduced,
                },
              },
            },
          });
        }
      }

      const result = await tx.production.findUniqueOrThrow({
        where: { id: id },
        include: {
          beSpokeDetails: {
            select: {
              quotedPrice: true,
            },
          },
        },
      });

      if (result.type === 'BE_SPOKE') {
        await tx.cashTransaction.create({
          data: {
            type: 'IN',
            source: 'PRODUCTION',
            referenceId: result.id,
            amount: result.beSpokeDetails?.quotedPrice ?? 0,
            storeId: result.storeId,
          },
        });
      }

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

  /// Tanpa paginasi: filternya sama dengan listing, seluruh baris ikut terbawa.
  async exportWorkbook(
    search?: string,
    type?: ProductionType,
    status?: ProductionStatus,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const rows = await prisma.production.findMany({
      where: this.buildWhere(search, type, status, dateFrom, dateTo),
      orderBy: { createdAt: 'desc' },
      select: {
        quantityProduced: true,
        type: true,
        status: true,
        targetDate: true,
        notes: true,
        createdAt: true,
        variant: {
          select: { sku: true, productMaster: { select: { name: true } } },
        },
        beSpokeDetails: { select: { title: true } },
        store: { select: { name: true } },
      },
    });

    const buffer = await buildWorkbook([
      {
        name: 'Produksi',
        columns: [
          { header: 'Tanggal dibuat', key: 'createdAt', width: 16 },
          { header: 'Produk', key: 'product', width: 34 },
          { header: 'SKU', key: 'sku', width: 18 },
          { header: 'Toko', key: 'store', width: 20 },
          { header: 'Tipe', key: 'type', width: 18 },
          { header: 'Status', key: 'status', width: 16 },
          { header: 'Jumlah', key: 'quantity', width: 12 },
          { header: 'Target selesai', key: 'targetDate', width: 16 },
          { header: 'Catatan', key: 'notes', width: 34 },
        ],
        rows: rows.map((row) => ({
          createdAt: row.createdAt.toISOString().slice(0, 10),
          /// Produksi custom tidak punya varian, judulnyalah identitasnya.
          product:
            row.variant?.productMaster.name ?? row.beSpokeDetails?.title ?? '-',
          sku: row.variant?.sku ?? '-',
          store: row.store?.name ?? '-',
          type: row.type,
          status: row.status,
          quantity: row.quantityProduced,
          targetDate: row.targetDate
            ? row.targetDate.toISOString().slice(0, 10)
            : '-',
          notes: row.notes ?? '-',
        })),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename('produksi', dateFrom, dateTo),
    };
  }
}
