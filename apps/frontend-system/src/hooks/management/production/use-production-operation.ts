import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduction,
  deleteProduction,
  fetchProductionData,
  updateProduction,
  updateProductionStatus,
  updateProductionStatusCompleted,
} from "@/lib/queries/production/production.query";
import { toast } from "sonner";
import {
  CreateProductionSchemaInput,
  UpdateProductionSchemaInput,
} from "@repo/schemas";

interface ProductionOperationProps {
  idProduction?: string;
  idProductionMaterial?: string;
  pagination?: {
    pageIndex: number;
    pageSize: number;
  };
  search?: string;
}
export const useProductionOperation = ({
  pagination,
  search,
}: ProductionOperationProps) => {
  const qc = useQueryClient();
  const isTableMode = !!pagination;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["production"] });

  const getProductionData = useQuery({
    queryKey: [
      "production",
      pagination?.pageIndex,
      pagination?.pageSize,
      search,
    ],
    queryFn: () =>
      fetchProductionData(pagination?.pageIndex, pagination?.pageSize, search),
    enabled: isTableMode,
    throwOnError: true,
  });

  const createProductionMutation = useMutation({
    mutationFn: createProduction,
    onSuccess: () => {
      invalidate();
      toast.success("Data produksi telah berhasil dibuat.");
    },
    onError: (err) => {
      toast.error(err.message);
    }
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
      toast.error(err.message, {position: "top-center"});
    }
  });

  const deleteProductionMutation = useMutation({
    mutationFn: (id: string) => deleteProduction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Data produksi telah berhasil dihapus.");
    },
    onError: (err) => {
      toast.error(err.message, {position: "top-center"});
    }
  });

  return {
    dataProduction: getProductionData.data,
    isLoadingDataProduction: getProductionData.isLoading,
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
