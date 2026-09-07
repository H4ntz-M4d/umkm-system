import {
  createExpense,
  ExpenseFilters,
  fetchExpense,
  fetchExpenseSummary,
  removeExpense,
} from "@/lib/queries/expense/expense.query";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useExpenseOperation = ({
  filters,
}: {
  filters?: ExpenseFilters;
}) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["expense"] });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const fetchExpenseQuery = useQuery({
    queryKey: ["expense", filters ?? {}],
    queryFn: () => fetchExpense(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const fetchExpenseSummaryQuery = useQuery({
    queryKey: ["expense-summary"],
    queryFn: () => fetchExpenseSummary(),
    throwOnError: true,
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil ditambahkan");
    },
    onError: showError("Gagal menambahkan pengeluaran"),
  });

  const removeExpenseMutation = useMutation({
    mutationFn: (id: string) => removeExpense(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dihapus");
    },
    onError: showError("Gagal menghapus pengeluaran"),
  });

  return {
    fetchExpenseData: fetchExpenseQuery.data,
    isLoadingFetchExpense: fetchExpenseQuery.isLoading,

    fetchExpenseSummaryData: fetchExpenseSummaryQuery.data,
    isLoadingFetchExpenseSummary: fetchExpenseSummaryQuery.isLoading,

    createExpenseData: createExpenseMutation.mutate,
    isLoadingCreateExpense: createExpenseMutation.isPending,

    removeExpenseData: removeExpenseMutation.mutate,
    isLoadingRemoveExpense: removeExpenseMutation.isPending,
  };
};
