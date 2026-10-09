import {
  BespokeFilters,
  createBespokeOrder,
  fetchBespokeOrders,
  fetchBespokeSummary,
  removeBespokeOrder,
  updateBespokeOrder,
  updateBespokeStatus,
} from "@/lib/queries/bespoke/bespoke.query";
import {
  BespokeOrderSchemaInput,
  BespokeStatusInput,
} from "@repo/schemas";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useBespokeOperation = ({
  filters,
}: {
  filters?: BespokeFilters;
}) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["bespoke"] });
    qc.invalidateQueries({ queryKey: ["bespoke-summary"] });
  };

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const listQuery = useQuery({
    queryKey: ["bespoke", filters ?? {}],
    queryFn: () => fetchBespokeOrders(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["bespoke-summary"],
    queryFn: fetchBespokeSummary,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: createBespokeOrder,
    onSuccess: () => {
      invalidate();
      toast.success("Pesanan custom berhasil dibuat");
    },
    onError: showError("Gagal membuat pesanan custom"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BespokeOrderSchemaInput }) =>
      updateBespokeOrder(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Pesanan custom berhasil diperbarui");
    },
    onError: showError("Gagal memperbarui pesanan custom"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BespokeStatusInput }) =>
      updateBespokeStatus(id, status),
    onSuccess: (res) => {
      invalidate();
      toast.success(
        res.data.status === "COMPLETED"
          ? "Pesanan custom selesai — uangnya dicatat sebagai kas masuk"
          : "Status pesanan custom diperbarui",
      );
    },
    onError: showError("Gagal mengubah status"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeBespokeOrder(id),
    onSuccess: () => {
      invalidate();
      toast.success("Pesanan custom dihapus");
    },
    onError: showError("Gagal menghapus pesanan custom"),
  });

  return {
    bespokeData: listQuery.data,
    isLoadingBespoke: listQuery.isLoading,

    bespokeSummary: summaryQuery.data,

    createBespokeData: createMutation.mutateAsync,
    isCreatingBespoke: createMutation.isPending,

    updateBespokeData: updateMutation.mutateAsync,
    isUpdatingBespoke: updateMutation.isPending,

    updateBespokeStatusData: statusMutation.mutate,
    isUpdatingStatus: statusMutation.isPending,

    removeBespokeData: removeMutation.mutate,
  };
};
