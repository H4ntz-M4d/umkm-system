import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseDto } from 'expense/dto/expense.dto';
import { toExponseResponse } from './expense.response';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';
import { buildExportFilename, buildWorkbook } from 'common/helpers/excel';

@Injectable()
export class ExpenseService {
  /**
   * Dipakai bersama oleh listing dan ekspor.
   *
   * Diekstrak supaya berkas Excel tidak mungkin menyaring berbeda dari yang
   * tampil di layar — kalau filternya diketik dua kali, cepat atau lambat
   * keduanya menyimpang tanpa ada yang menyadari.
   */
  private buildWhere(
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Prisma.ExpenseWhereInput {
    return {
      ...(category && {
        expenseCategory: {
          name: { contains: category, mode: 'insensitive' },
        },
      }),

      ...(search && {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      }),

      date: {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      },
    };
  }

  async findAll(
    pagination: Pagination,
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const whereClause = this.buildWhere(search, category, dateFrom, dateTo);

    const [data, total] = await Promise.all([
      prisma.expense.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          storeId: true,
          categoryId: true,
          description: true,
          totalAmount: true,
          date: true,
          createdAt: true,
          expenseCategory: { select: { name: true } },
        },
      }),
      prisma.expense.count({ where: whereClause }),
    ]);

    const result = data.map(toExponseResponse);

    return {
      success: true,
      data: result,
      meta: {
        skip,
        limit,
        total,
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async summary() {
    const thisYear = new Date();
    const earlyYear = new Date(thisYear.getFullYear(), 0, 1);
    const earlyNextYear = new Date(thisYear.getFullYear() + 1, 0, 1);

    const totalExpense = await prisma.expense.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        date: {
          gte: earlyYear,
          lt: earlyNextYear,
        },
      },
    });

    const thisMonth = new Date();
    const earlyMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth(),
      1,
    );
    const earlyNextMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      1,
    );

    const totalExpenseThisMonth = await prisma.expense.aggregate({
      _sum: {
        totalAmount: true,
      },
      where: {
        date: {
          gte: earlyMonth,
          lt: earlyNextMonth,
        },
      },
    });

    const totalActiveCategory = await prisma.expenseCategory.count({
      where: {
        isActive: true,
      },
    });

    const dataSummary = {
      totalExpense: totalExpense._sum.totalAmount ?? String(0),
      totalExpenseThisMonth:
        totalExpenseThisMonth._sum.totalAmount ?? String(0),
      totalActiveCategory: totalActiveCategory ?? 0,
    };

    return {
      success: true,
      data: dataSummary,
      meta: {
        timeStamp: new Date().toISOString(),
      },
    };
  }

  async create(data: ExpenseDto) {
    const transaction = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          storeId: BigInt(data.storeId),
          categoryId: BigInt(data.categoryId),
          description: data.description,
          totalAmount: data.totalAmount,
          date: data.date,
          expenseItem: {
            create: data.expenseItem.map((item) => ({
              itemName: item.itemName,
              quantity: item.quantity,
              unit: item.unit,
              price: item.price,
              subtotal: item.subtotal,
            })),
          },
        },
        include: { expenseItem: true },
      });

      await tx.cashTransaction.create({
        data: {
          type: 'OUT',
          source: 'EXPENSE',
          referenceId: expense.id,
          amount: expense.totalAmount,
          storeId: expense.storeId,
        },
      });

      return expense;
    });

    return transaction;
  }

  async remove(id: bigint) {
    const isExisting = await prisma.expense.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!isExisting) {
      throw new BadRequestException('Maaf data pengeluaran tidak ditemukan');
    }

    const result = await prisma.expense.delete({
      where: { id },
      include: { expenseItem: true },
    });

    await prisma.cashTransaction.delete({
      where: {
        referenceId_source: {
          referenceId: id,
          source: 'EXPENSE',
        },
      },
    });

    return result;
  }

  /// Tanpa `skip`/`take`: filternya sama dengan listing, tapi seluruh baris
  /// ikut terbawa — inti dari ekspor yang tidak terpotong paginasi.
  async exportWorkbook(
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const rows = await prisma.expense.findMany({
      where: this.buildWhere(search, category, dateFrom, dateTo),
      orderBy: { date: 'desc' },
      select: {
        date: true,
        description: true,
        totalAmount: true,
        expenseCategory: { select: { name: true } },
        store: { select: { name: true } },
      },
    });

    const buffer = await buildWorkbook([
      {
        name: 'Pengeluaran',
        columns: [
          { header: 'Tanggal', key: 'date', width: 14 },
          { header: 'Kategori', key: 'category', width: 24 },
          { header: 'Toko', key: 'store', width: 22 },
          { header: 'Keterangan', key: 'description', width: 40 },
          { header: 'Jumlah', key: 'total', money: true },
        ],
        rows: rows.map((row) => ({
          date: row.date.toISOString().slice(0, 10),
          category: row.expenseCategory?.name ?? '-',
          store: row.store?.name ?? '-',
          description: row.description ?? '-',
          total: row.totalAmount.toString(),
        })),
      },
    ]);

    return {
      buffer,
      filename: buildExportFilename('pengeluaran', dateFrom, dateTo),
    };
  }
}
