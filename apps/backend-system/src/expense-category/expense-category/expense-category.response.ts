import { Prisma } from '@repo/db';

type ExpenseCategoryEntity = Prisma.ExpenseCategoryGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    color: true;
    isActive: true;
    createdAt: true;
    _count: {
      select: {
        expenses: true;
      };
    };
  };
}>;

export function toExpenseCategoryResponse(entity: ExpenseCategoryEntity) {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    color: entity.color,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    expenseCount: entity._count.expenses,
  };
}

type ExpenseCategoryOnlyEntity = Prisma.ExpenseCategoryGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    color: true;
    isActive: true;
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
  };
}
