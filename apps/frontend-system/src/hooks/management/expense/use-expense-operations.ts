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

  const fetchExpenseQuery = useQuery({
    queryKey: ["expense", filters ?? {}],
    queryFn: () => fetchExpense(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const fetchExpenseSummaryQuery = useQuery({
    queryKey: ["expense-summary"],
    queryFn: () => fetchExpenseSummary(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil ditambahkan");
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const removeExpenseMutation = useMutation({
    mutationFn: (id: string) => removeExpense(id),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil dihapus");
    },
    onError: (err) => {
      console.log(err);
    },
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
