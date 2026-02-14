import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { createStore, fetchStore, removeStore, updateStore } from "@/lib/stores/stores.query";
import { toast } from "sonner"; // Rekomendasi: pakai toast daripada alert()

export function useStoreOperations(pagination: { pageIndex: number; pageSize: number }) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["store", pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchStore(pagination.pageIndex, pagination.pageSize),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["store"] });

  const createMutation = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil ditambahkan", {position: "top-center"});
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateStore(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil diperbarui", {position: "top-center"});
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeStore,
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil dihapus", {position: "top-center"});
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    createData: createMutation.mutate,
    updateData: updateMutation.mutate,
    deleteData: deleteMutation.mutate,
  };
}