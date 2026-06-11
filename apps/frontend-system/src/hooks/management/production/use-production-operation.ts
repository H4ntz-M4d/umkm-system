import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduction,
  deleteProduction,
  fetchProductionData,
  fetchProductionSummary,
  ProductionFilters,
  updateProduction,
  updateProductionStatus,
  updateProductionStatusCompleted,
} from "@/lib/queries/production/production.query";
import { toast } from "sonner";
import {
  CreateProductionSchemaInput,
  UpdateProductionSchemaInput,
} from "@repo/schemas";

export const useProductionOperation = ({
  filters,
  isTableMode = false,
}: {
  filters?: ProductionFilters;
  isTableMode?: boolean;
}) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["production"] });

  const getProductionData = useQuery({
    queryKey: ["production", filters ?? {}],
    queryFn: () => fetchProductionData(filters ?? {}),
    enabled: isTableMode,
    throwOnError: true,
  });

  const getProductionSummary = useQuery({
    queryKey: ["production"],
    queryFn: () => fetchProductionSummary(),
    enabled: isTableMode,
  });

  const createProductionMutation = useMutation({
    mutationFn: createProduction,
    onSuccess: () => {
      invalidate();
      toast.success("Data produksi telah berhasil dibuat.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateProductionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateProductionSchemaInput;
    }) => updateProduction(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil mengubah data.");
    },
  });

  const updateProductionStatusMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductionSchemaInput;
    }) => updateProductionStatus(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil mengubah status data.");
    },
  });

  const updateProductionStatusCompletedMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductionSchemaInput;
    }) => updateProductionStatusCompleted(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil mengubah status data.");
    },
    onError: (err) => {
      toast.error(err.message, { position: "top-center" });
    },
  });

  const deleteProductionMutation = useMutation({
    mutationFn: (id: string) => deleteProduction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Data produksi telah berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.message, { position: "top-center" });
    },
  });

  return {
    dataProduction: getProductionData.data,
    isLoadingDataProduction: getProductionData.isLoading,
    fetchProductionSummaryData: getProductionSummary.data,
    createProductionData: createProductionMutation.mutate,
    isCreating: createProductionMutation.isPending,
    updateProductionData: updateProductionMutation.mutate,
    isUpdating: updateProductionMutation.isPending,
    updateProductionStatusData: updateProductionStatusMutation.mutate,
    isUpdatingStatus: updateProductionStatusMutation.isPending,
    updateProductionStatusCompletedData:
      updateProductionStatusCompletedMutation.mutate,
    isUpdatingStatusCompleted:
      updateProductionStatusCompletedMutation.isPending,
    deleteProductionData: deleteProductionMutation.mutate,
  };
};
