import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BespokeStatus, Prisma, prisma } from '@repo/db';
import { idFormat } from 'common/helpers/id-format';
import { findProductionHouse } from 'common/helpers/online-store';
import {
  BespokeOrderDto,
  BespokeQueryDto,
  UpdateBespokeStatusDto,
} from 'bespoke/dto/bespoke.dto';
import { toBespokeOrderResponse } from './bespoke.response';

const bespokeInclude = {
  customer: { select: { name: true, email: true, phone: true } },
  productMaster: { select: { name: true } },
} satisfies Prisma.BespokeOrderInclude;

@Injectable()
export class BespokeService {
  private buildWhere(query: BespokeQueryDto): Prisma.BespokeOrderWhereInput {
    return {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { code: { contains: query.search, mode: 'insensitive' } },
          { title: { contains: query.search, mode: 'insensitive' } },
          {
            customer: {
              name: { contains: query.search, mode: 'insensitive' },
            },
          },
        ],
      }),
    };
  }

  async findAll(query: BespokeQueryDto) {
    const skip = query.skip ?? 0;
    const limit = query.limit ?? 10;
    const where = this.buildWhere(query);

    const [data, total] = await Promise.all([
      prisma.bespokeOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: bespokeInclude,
      }),
      prisma.bespokeOrder.count({ where }),
    ]);

    return {
      success: true,
      data: data.map(toBespokeOrderResponse),
      meta: { skip, limit, total, timeStamp: new Date().toISOString() },
    };
  }

  async summary() {
    const grouped = await prisma.bespokeOrder.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const countOf = (status: BespokeStatus) =>
      grouped.find((row) => row.status === status)?._count._all ?? 0;

    /// Nilai yang sudah benar-benar masuk: hanya pesanan yang selesai, karena
    /// itulah yang mencatat kas.
    const completedValue = await prisma.bespokeOrder.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { quotedPrice: true },
    });

    return {
      success: true,
      data: {
        planned: countOf('PLANNED'),
        inProgress: countOf('IN_PROGRESS'),
        completed: countOf('COMPLETED'),
        cancelled: countOf('CANCELLED'),
        completedValue:
          completedValue._sum.quotedPrice ?? new Prisma.Decimal(0),
      },
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async findOne(id: bigint) {
    const data = await prisma.bespokeOrder.findUnique({
      where: { id },
      include: bespokeInclude,
    });

    if (!data) throw new NotFoundException('Pesanan custom tidak ditemukan');

    return {
      success: true,
      data: toBespokeOrderResponse(data),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Pembeli dicari dari emailnya lebih dulu, baru dibuat kalau belum ada.
   *
   * Email jadi kuncinya karena pesanan custom sering datang dari orang yang
   * sama berkali-kali, dan membuat baris pembeli baru setiap kali akan
   * memecah riwayatnya.
   */
  private async resolveCustomer(
    tx: Prisma.TransactionClient,
    customer: BespokeOrderDto['customer'],
  ) {
    const existing = await tx.customer.findFirst({
      where: { email: customer.email },
      select: { id: true },
    });

    if (existing) {
      await tx.customer.update({
        where: { id: existing.id },
        data: { name: customer.name, phone: customer.phone },
      });
      return existing.id;
    }

    const created = await tx.customer.create({
      data: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
      select: { id: true },
    });

    return created.id;
  }

  /**
   * Memastikan produk acuan memang ada sebelum disimpan.
   *
   * Yang kosong dibiarkan kosong — itu penanda sah bahwa desainnya di luar
   * katalog, dan aturan jumlah minimumnya sudah dijaga skema.
   */
  private async resolveProductMaster(productMasterId?: string | null) {
    if (!productMasterId) return null;

    const product = await prisma.productMaster.findUnique({
      where: { id: BigInt(productMasterId) },
      select: { id: true },
    });

    if (!product) {
      throw new BadRequestException('Produk acuan tidak ditemukan di katalog.');
    }

    return product.id;
  }

  async create(data: BespokeOrderDto) {
    const productMasterId = await this.resolveProductMaster(
      data.productMasterId,
    );

    const result = await prisma.$transaction(async (tx) => {
      const customerId = await this.resolveCustomer(tx, data.customer);

      return tx.bespokeOrder.create({
        data: {
          code: idFormat('BSP'),
          customerId,
          title: data.title,
          description: data.description,
          productMasterId: productMasterId,
          quantity: data.quantity,
          quotedPrice: data.quotedPrice,
          targetDate: data.targetDate,
          notes: data.notes,
        },
        include: bespokeInclude,
      });
    });

    return {
      success: true,
      data: toBespokeOrderResponse(result),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async update(id: bigint, data: BespokeOrderDto) {
    const isExisting = await prisma.bespokeOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!isExisting) {
      throw new NotFoundException('Pesanan custom tidak ditemukan');
    }

    /// Pesanan yang sudah tutup buku tidak diubah lagi: harganya sudah masuk
    /// kas, dan mengubahnya diam-diam membuat laporan tidak cocok.
    if (isExisting.status === 'COMPLETED') {
      throw new BadRequestException(
        'Pesanan custom yang sudah selesai tidak bisa diubah lagi',
      );
    }

    const productMasterId = await this.resolveProductMaster(
      data.productMasterId,
    );

    const result = await prisma.$transaction(async (tx) => {
      const customerId = await this.resolveCustomer(tx, data.customer);

      return tx.bespokeOrder.update({
        where: { id },
        data: {
          customerId,
          title: data.title,
          description: data.description,
          productMasterId: productMasterId,
          quantity: data.quantity,
          quotedPrice: data.quotedPrice,
          targetDate: data.targetDate,
          notes: data.notes,
        },
        include: bespokeInclude,
      });
    });

    return {
      success: true,
      data: toBespokeOrderResponse(result),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  /**
   * Mengubah status pengerjaan.
   *
   * Selesai adalah satu-satunya status yang membawa akibat: uang yang
   * disepakati dicatat sebagai kas masuk. Karena itu perpindahannya dikunci
   * dengan `updateMany` bersyarat — dua admin yang menekan Selesai bersamaan
   * tidak boleh menghasilkan dua baris kas.
   */
  async updateStatus(id: bigint, data: UpdateBespokeStatusDto) {
    const isExisting = await prisma.bespokeOrder.findUnique({
      where: { id },
      select: { id: true, status: true, quotedPrice: true },
    });

    if (!isExisting) {
      throw new NotFoundException('Pesanan custom tidak ditemukan');
    }

    if (isExisting.status === data.status) {
      throw new BadRequestException('Status pesanan custom tidak berubah');
    }

    if (
      isExisting.status === 'COMPLETED' ||
      isExisting.status === 'CANCELLED'
    ) {
      throw new BadRequestException(
        'Pesanan custom yang sudah selesai atau dibatalkan tidak bisa diubah lagi',
      );
    }

    const isCompleting = data.status === 'COMPLETED';

    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.bespokeOrder.updateMany({
        where: { id, status: isExisting.status },
        data: {
          status: data.status,
          ...(isCompleting && { completedAt: new Date() }),
        },
      });

      if (claimed.count === 0) {
        throw new BadRequestException(
          'Status pesanan custom baru saja diubah orang lain. Muat ulang halaman untuk melihat keadaan terbaru.',
        );
      }

      if (isCompleting) {
        /// Uangnya masuk ke toko utama, tempat pesanan custom diurus.
        const productionHouse = await findProductionHouse(tx);

        await tx.cashTransaction.create({
          data: {
            type: 'IN',
            source: 'BESPOKE',
            referenceId: id,
            amount: isExisting.quotedPrice,
            storeId: productionHouse.id,
          },
        });
      }

      return tx.bespokeOrder.findUniqueOrThrow({
        where: { id },
        include: bespokeInclude,
      });
    });

    return {
      success: true,
      data: toBespokeOrderResponse(result),
      meta: { timeStamp: new Date().toISOString() },
    };
  }

  async remove(id: bigint) {
    const isExisting = await prisma.bespokeOrder.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!isExisting) {
      throw new NotFoundException('Pesanan custom tidak ditemukan');
    }

    /// Yang sudah selesai sudah tercatat di kas; menghapusnya akan membuat
    /// laporan menunjuk pesanan yang tidak ada.
    if (isExisting.status === 'COMPLETED') {
      throw new BadRequestException(
        'Pesanan custom yang sudah selesai tidak bisa dihapus karena uangnya sudah tercatat di kas',
      );
    }

    await prisma.bespokeOrder.delete({ where: { id } });

    return {
      success: true,
      data: { id },
      meta: { timeStamp: new Date().toISOString() },
    };
  }
}
