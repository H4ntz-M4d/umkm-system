import {
  createExpenseCategories,
  fetchExpenseCategories,
  removeByStatus,
  removePermanent,
  updateExpenseCategories,
} from "@/lib/queries/expense/expense-categories.query";
import { ExpenseCategorySchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useExpenseCategoriesOperation = ({
  isTabActive = false,
}: {
  isTabActive?: boolean;
}) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["expense-categories"] });
  };

  const fetchExpenseCategoriesQuery = useQuery({
    queryKey: ["expense-categories"],
    queryFn: () => fetchExpenseCategories(),
    // enabled: isTabActive,
  });

  const createExpenseCategoryMutation = useMutation({
    mutationFn: createExpenseCategories,
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil ditambahkan");
    },
  });

  const updateExpenseCategoriesMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ExpenseCategorySchemaInput;
    }) => updateExpenseCategories(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil diperbarui");
    },
  });

  const removeByStatusMutation = useMutation({
    mutationFn: (id: string) => removeByStatus(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dinonaktifkan");
    },
  });

  const removePermanentMutation = useMutation({
    mutationFn: (id: string) => removePermanent(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dihapus");
    },
  });

  return {
    dataExpenseCategories: fetchExpenseCategoriesQuery.data,
    isLoadingExpenseCategories: fetchExpenseCategoriesQuery.isLoading,

    createExpenseCategoryData: createExpenseCategoryMutation.mutate,
    isLoadingCreateExpenseCategory: createExpenseCategoryMutation.isPending,

    updateExpenseCategoriesData: updateExpenseCategoriesMutation.mutate,
    isLoadingUpdateExpenseCategories: updateExpenseCategoriesMutation.isPending,

    removeByStatusData: removeByStatusMutation.mutate,
    isLoadingRemoveByStatus: removeByStatusMutation.isPending,

    removePermanentData: removePermanentMutation.mutate,
    isLoadingRemovePermanent: removePermanentMutation.isPending,
  };
};
