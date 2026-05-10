import { Prisma } from '@repo/db';

interface ExpenseCategoryEntity extends Prisma.ExpenseCategoryGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    color: true;
    isActive: true;
    isMaterialsCategory: true;
    createdAt: true;
    _count: {
      select: {
        expenses: true;
      };
    };
  };
}> {
  totalExpense: Prisma.Decimal | number;
}

export function toExpenseCategoryResponse(entity: ExpenseCategoryEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    color: entity.color,
    isActive: entity.isActive,
    isMaterialsCategory: entity.isMaterialsCategory,
    createdAt: entity.createdAt,
    expenseCount: entity._count.expenses,
    totalExpenses: Number(entity.totalExpense || 0),
  };
}

type ExpenseCategoryOnlyEntity = Prisma.ExpenseCategoryGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    color: true;
    isActive: true;
    isMaterialsCategory: true;
    createdAt: true;
  };
}>;

export function toExpenseCategoryOnlyResponse(
  entity: ExpenseCategoryOnlyEntity,
) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    color: entity.color,
    isActive: entity.isActive,
    isMaterialsCategory: entity.isMaterialsCategory,
    createdAt: entity.createdAt,
  };
}
