import {
  createExpense,
  ExpenseFilters,
  fetchExpense,
  fetchExpenseDetail,
  fetchExpenseSummary,
  removeExpense,
  removeExpenseProof,
  updateExpense,
  uploadExpenseProofs,
} from "@/lib/queries/expense/expense.query";
import { ExpenseSchemaInput } from "@repo/schemas";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useExpenseOperation = ({
  filters,
  expenseId,
}: {
  filters?: ExpenseFilters;
  /// Diisi saat dialog dibuka untuk mengedit; detailnya baru diambil kalau
  /// ada isinya, jadi dialog "tambah" tidak memanggil apa-apa.
  expenseId?: string | null;
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

  const expenseDetailQuery = useQuery({
    queryKey: ["expense", "detail", expenseId],
    queryFn: () => fetchExpenseDetail(expenseId as string),
    enabled: !!expenseId,
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

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ExpenseSchemaInput }) =>
      updateExpense(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Catatan pengeluaran berhasil diperbarui");
    },
    onError: showError("Gagal memperbarui pengeluaran"),
  });

  const uploadProofsMutation = useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      uploadExpenseProofs(id, files),
    onSuccess: (res) => {
      invalidate();
      toast.success(`Bukti tersimpan (${res.data.length} foto)`);
    },
    onError: showError("Gagal mengunggah bukti"),
  });

  const removeProofMutation = useMutation({
    mutationFn: ({ id, proofId }: { id: string; proofId: string }) =>
      removeExpenseProof(id, proofId),
    onSuccess: () => {
      invalidate();
      toast.success("Bukti dihapus");
    },
    onError: showError("Gagal menghapus bukti"),
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

    expenseDetailData: expenseDetailQuery.data,
    isLoadingExpenseDetail: expenseDetailQuery.isLoading,

    createExpenseData: createExpenseMutation.mutate,
    /// Bentuk async-nya dipakai dialog: setelah pengeluaran terbentuk,
    /// id-nya dibutuhkan untuk mengunggah bukti yang sudah dipilih.
    createExpenseAsync: createExpenseMutation.mutateAsync,
    isLoadingCreateExpense: createExpenseMutation.isPending,

    updateExpenseAsync: updateExpenseMutation.mutateAsync,
    isLoadingUpdateExpense: updateExpenseMutation.isPending,

    uploadProofsAsync: uploadProofsMutation.mutateAsync,
    isUploadingProofs: uploadProofsMutation.isPending,

    removeProofAsync: removeProofMutation.mutateAsync,
    isRemovingProof: removeProofMutation.isPending,

    removeExpenseData: removeExpenseMutation.mutate,
    isLoadingRemoveExpense: removeExpenseMutation.isPending,
  };
};
