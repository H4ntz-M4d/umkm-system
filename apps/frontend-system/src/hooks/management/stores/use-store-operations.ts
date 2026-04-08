import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  createStore,
  fetchStore,
  fetchStoreList,
  removeStore,
  updateStore,
} from "@/lib/queries/stores/stores.query";
import { toast } from "sonner";
import { fetchUserById } from "@/lib/queries/users/users.query";
import { StoreInput } from "@repo/schemas"; // Rekomendasi: pakai toast daripada alert()

export const storeKeys = {
  all: ["store"] as const,
  lists: () => [...storeKeys.all, "list"] as const,
  paginated: (params: { pageIndex?: number; pageSize?: number }) =>
    [...storeKeys.lists(), params] as const,
  simpleList: () => [...storeKeys.all, "simple-list"] as const,
};

export function useStoreOperations({
  pagination,
  enableStoreList = false,
}: {
  pagination?: { pageIndex: number; pageSize: number };
  enableStoreList?: boolean;
}) {
  const qc = useQueryClient();
  const isTableMode = !!pagination;

  const query = useQuery({
    queryKey: storeKeys.paginated({
      pageIndex: pagination?.pageIndex,
      pageSize: pagination?.pageSize,
    }),
    queryFn: () => fetchStore(pagination!.pageIndex, pagination!.pageSize),
    placeholderData: keepPreviousData,
    enabled: isTableMode,
  });

  const getStoreList = useQuery({
    queryKey: storeKeys.simpleList(),
    queryFn: () => fetchStoreList(),
    enabled: enableStoreList,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: storeKeys.all });

  const createMutation = useMutation({
    mutationFn: createStore,
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil ditambahkan", { position: "top-center" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreInput }) =>
      updateStore(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil diperbarui", { position: "top-center" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: removeStore,
    onSuccess: () => {
      invalidate();
      toast.success("Toko berhasil dihapus", { position: "top-center" });
    },
  });

  return {
    data: query.data,
    storeList: getStoreList.data,
    isLoading: query.isLoading,
    createData: createMutation.mutate,
    updateData: updateMutation.mutate,
    deleteData: deleteMutation.mutate,
  };
}
