import {
  createExpense,
  ExpenseFilters,
  fetchExpense,
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
  filters: ExpenseFilters;
}) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["expense"] });

  const fetchExpenseQuery = useQuery({
    queryKey: ["expense", filters],
    queryFn: () => fetchExpense(filters),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const createExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil ditambahkan");
    },
    onError: (err) => {
      console.log(err);
    }
  });

  return {
    fetchExpenseData: fetchExpenseQuery.data,
    isLoadingFetchExpense: fetchExpenseQuery.isLoading,

    createExpenseData: createExpenseMutation.mutate,
    isLoadingCreateExpense: createExpenseMutation.isPending,
  };
};
