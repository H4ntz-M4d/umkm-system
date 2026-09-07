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

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

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
    onError: showError("Gagal menambahkan kategori pengeluaran"),
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
    onError: showError("Gagal memperbarui kategori pengeluaran"),
  });

  const removeByStatusMutation = useMutation({
    mutationFn: (id: string) => removeByStatus(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dinonaktifkan");
    },
    onError: showError("Gagal menonaktifkan kategori pengeluaran"),
  });

  const removePermanentMutation = useMutation({
    mutationFn: (id: string) => removePermanent(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dihapus");
    },
    onError: showError("Gagal menghapus kategori pengeluaran"),
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
