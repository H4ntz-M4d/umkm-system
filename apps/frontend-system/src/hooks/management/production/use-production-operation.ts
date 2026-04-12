import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduction, deleteProduction,
  fetchProductionData,
  updateProduction,
} from "@/lib/queries/production/production.query";
import { toast } from "sonner";
import { UpdateProductionSchemaInput } from "@repo/schemas";

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
    queryKey: ["production", pagination?.pageIndex, pagination?.pageSize],
    queryFn: () =>
      fetchProductionData(pagination?.pageIndex, pagination?.pageSize, search),
    enabled: isTableMode,
    throwOnError: true,
  });

  const createProductionMutation = useMutation({
    mutationFn: createProduction,
    onSuccess: () => {
      toast.success("Data produksi telah berhasil dibuat.");
    },
  });

  const updateProductionMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProductionSchemaInput;
    }) => updateProduction(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil mengubah data.");
    },
  });

  const deleteProductionMutation = useMutation({
    mutationFn: (id: string) => deleteProduction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Data produksi telah berhasil dihapus.");
    }
  })

  return {
    dataProduction: getProductionData.data,
    isLoadingDataProduction: getProductionData.isLoading,
    createProductionData: createProductionMutation.mutate,
    isCreating: createProductionMutation.isPending,
    updateProductionData: updateProductionMutation.mutate,
    isUpdating: updateProductionMutation.isPending,
    deleteProductionData: deleteProductionMutation.mutate
  };
};
