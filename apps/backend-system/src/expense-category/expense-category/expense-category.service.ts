import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import { ExpenseCategoryDto } from 'expense-category/dto/expense-category.dto';
import {
  toExpenseCategoryOnlyResponse,
  toExpenseCategoryResponse,
} from './expense-category.response';

@Injectable()
export class ExpenseCategoryService {
  async findAll() {
    const data = await prisma.expenseCategory.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            expenses: true,
          },
        },
      },
    });

    const res = data.map(toExpenseCategoryResponse);
    return res;
  }

  async create(data: ExpenseCategoryDto) {
    const res = await prisma.expenseCategory.create({
      data: {
        ...data,
      },
    });
    return toExpenseCategoryOnlyResponse(res);
  }

  async update(id: bigint, data: ExpenseCategoryDto) {
    const res = await prisma.expenseCategory.update({
      where: {
        id: id,
      },
      data: {
        ...data,
      },
    });
    return toExpenseCategoryOnlyResponse(res);
  }

  async removeByStatus(id: bigint) {
    const res = await prisma.expenseCategory.update({
      where: {
        id: id,
      },
      data: {
        isActive: false,
      },
    });
    return toExpenseCategoryOnlyResponse(res);
  }

  async removePermanent(id: bigint) {
    const res = await prisma.expenseCategory.delete({
      where: {
        id: id,
      },
    });
    return toExpenseCategoryOnlyResponse(res);
  }
}
