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
    _count: {
      select: {
        proofs: true;
      };
    };
    userId: true;
    user: {
      select: {
        employees: {
          select: {
            name: true;
          };
        };
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
    /// Jumlahnya saja, bukan seluruh URL: daftar pengeluaran cuma perlu tahu
    /// baris mana yang punya lampiran.
    proofCount: entity._count.proofs,
    createdById: entity.userId,
    createdByName: entity.user?.employees?.name ?? null,
  };
}

type ExpenseDetailEntity = Prisma.ExpenseGetPayload<{
  include: {
    expenseItem: true;
    proofs: true;
    user: {
      select: {
        employees: {
          select: {
            name: true;
          };
        };
      };
    };
  };
}>;

/// Bentuk detail: dipakai saat membuka dialog edit, jadi item dan buktinya
/// ikut lengkap.
export function toExpenseDetailResponse(entity: ExpenseDetailEntity) {
  return {
    id: entity.id,
    storeId: entity.storeId,
    categoryId: entity.categoryId,
    description: entity.description,
    totalAmount: entity.totalAmount,
    date: entity.date,
    createdAt: entity.createdAt,
    createdById: entity.userId,
    createdByName: entity.user?.employees?.name ?? null,
    expenseItem: entity.expenseItem,
    proofs: entity.proofs.map((proof) => ({
      id: proof.id,
      image: proof.image,
      createdAt: proof.createdAt,
    })),
  };
}
