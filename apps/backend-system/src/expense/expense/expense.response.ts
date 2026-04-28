import { Prisma } from '@repo/db';

type ExpenseEntity = Prisma.ExpenseGetPayload<{
  select: {
    id: true;
    storeId: true;
    categoryId: true;
    description: true;
    totalAmount: true;
    date: true;
    createdAt: true;
    expenseCategory: {
      select: {
        name: true;
      };
    };
  };
}>;

export function toExponseResponse(entity: ExpenseEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    categoryId: entity.categoryId,
    categoryName: entity.expenseCategory.name,
    description: entity.description,
    totalAmount: entity.totalAmount,
    date: entity.date,
    createdAt: entity.createdAt,
  };
}
