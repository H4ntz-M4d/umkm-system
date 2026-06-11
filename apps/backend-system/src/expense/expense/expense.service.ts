import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, prisma } from '@repo/db';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseDto } from 'expense/dto/expense.dto';
import { toExponseResponse } from './expense.response';
import { toEndOfDay, toStartOfDay } from 'common/helpers/date-format';

@Injectable()
export class ExpenseService {
  async findAll(
    pagination: Pagination,
    search?: string,
    category?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const skip = pagination.skip ?? 0;
    const limit = pagination.limit ?? 10;

    const whereClause: Prisma.ExpenseWhereInput = {
      expenseCategory: category
        ? {
            name: { contains: category, mode: 'insensitive' },
          }
        : undefined,
      description: search
        ? {
            contains: search,
            mode: 'insensitive',
          }
        : undefined,
      date: {
        gte: dateFrom ? toStartOfDay(dateFrom) : undefined,
        lte: dateTo ? toEndOfDay(dateTo) : undefined,
      },
    };

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

    return result;
  }
}
