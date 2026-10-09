import {
  cancelProductionDelivery,
  closeProduction,
  createProduction,
  fetchProductionDetail,
  fetchProductions,
  fetchProductionSummary,
  ProductionFilters,
  recordProductionDelivery,
  removeProduction,
  updateProduction,
} from "@/lib/queries/production/production.query";
import {
  CreateProductionSchemaInput,
  RecordDeliverySchemaInput,
} from "@repo/schemas";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

export const useProductionOperation = ({
  filters,
  productionId,
}: {
  filters?: ProductionFilters;
  /// Diisi layar detail batch; daftar tidak menariknya.
  productionId?: string | null;
}) => {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["production"] });
    qc.invalidateQueries({ queryKey: ["production-summary"] });
    /// Setoran menggerakkan stok, jadi layar stok ikut disegarkan.
    qc.invalidateQueries({ queryKey: ["inventory-ledgers"] });
    qc.invalidateQueries({ queryKey: ["low-stock"] });
  };

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const listQuery = useQuery({
    queryKey: ["production", filters ?? {}],
    queryFn: () => fetchProductions(filters ?? {}),
    placeholderData: keepPreviousData,
    throwOnError: true,
  });

  const summaryQuery = useQuery({
    queryKey: ["production-summary"],
    queryFn: fetchProductionSummary,
    throwOnError: true,
  });

  const detailQuery = useQuery({
    queryKey: ["production", "detail", productionId],
    queryFn: () => fetchProductionDetail(productionId as string),
    enabled: !!productionId,
    throwOnError: true,
  });

  const createMutation = useMutation({
    mutationFn: createProduction,
    onSuccess: (res) => {
      invalidate();
      toast.success(`Batch ${res.data.code} dibuat`);
    },
    onError: showError("Gagal membuat batch produksi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateProductionSchemaInput;
    }) => updateProduction(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Batch produksi diperbarui");
    },
    onError: showError("Gagal memperbarui batch"),
  });

  const deliveryMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: RecordDeliverySchemaInput;
    }) => recordProductionDelivery(id, data),
    onSuccess: (res) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["production", "detail"] });
      toast.success("Setoran tercatat", {
        description:
          res.data.status === "COMPLETED"
            ? "Seluruh target batch terpenuhi — batch ditandai selesai."
            : `Kemajuan batch ${res.data.totalDelivered}/${res.data.totalTarget} pcs.`,
      });
    },
    onError: showError("Gagal mencatat setoran"),
  });

  const cancelDeliveryMutation = useMutation({
    mutationFn: ({ id, deliveryId }: { id: string; deliveryId: string }) =>
      cancelProductionDelivery(id, deliveryId),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["production", "detail"] });
      toast.success("Setoran dibatalkan dan stoknya ditarik kembali");
    },
    onError: showError("Gagal membatalkan setoran"),
  });

  const closeMutation = useMutation({
    mutationFn: ({
      id,
      createContinuation,
    }: {
      id: string;
      createContinuation: boolean;
    }) => closeProduction(id, createContinuation),
    onSuccess: (res) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["production", "detail"] });
      toast.success("Batch ditutup", {
        description: res.data.continuationCode
          ? `Sisa targetnya dipindahkan ke batch ${res.data.continuationCode}.`
          : undefined,
      });
    },
    onError: showError("Gagal menutup batch"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeProduction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Batch produksi dihapus");
    },
    onError: showError("Gagal menghapus batch"),
  });

  return {
    productionData: listQuery.data,
    isLoadingProduction: listQuery.isLoading,

    productionSummary: summaryQuery.data,

    productionDetail: detailQuery.data,
    isLoadingDetail: detailQuery.isLoading,

    createProductionData: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateProductionData: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    recordDeliveryData: deliveryMutation.mutateAsync,
    isRecordingDelivery: deliveryMutation.isPending,

    cancelDeliveryData: cancelDeliveryMutation.mutate,
    isCancellingDelivery: cancelDeliveryMutation.isPending,

    closeProductionData: closeMutation.mutateAsync,
    isClosing: closeMutation.isPending,

    removeProductionData: removeMutation.mutate,
  };
};
