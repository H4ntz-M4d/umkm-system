import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createRawMaterial, deleteRawMaterial,
  fetchAllMaterials,
  fetchMaterialsById, fetchRawMaterialList,
  updateRawMaterial,
} from "@/lib/queries/raw-materials/raw-materials.query";
import { toast } from "sonner";
import { UpdateMaterialsSchemaInput } from "@repo/schemas";

interface MaterialsOperationProps {
  pagination?: { pageIndex?: number; pageSize?: number };
  search?: string | undefined;
  idMaterial?: string | undefined | null;
  enabledRawMaterialList?: boolean;
}
export const useMaterialsOperations = ({
  pagination,
  search,
  idMaterial,
  enabledRawMaterialList = false,
}: MaterialsOperationProps) => {
  const qc = useQueryClient();
  const isTableMode = !!pagination;

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["raw-materials"] });

  const getMaterialsData = useQuery({
    queryKey: [
      "raw-materials",
      pagination?.pageIndex,
      pagination?.pageSize,
      search,
    ],
    queryFn: () =>
      fetchAllMaterials(pagination?.pageIndex, pagination?.pageSize, search),
    placeholderData: keepPreviousData,
    enabled: isTableMode,
  });

  const getMaterialsList = useQuery({
    queryKey: ["raw-materials", "list"],
    queryFn: () => fetchRawMaterialList(),
    enabled: enabledRawMaterialList
  })

  const getMaterialsDataById = useQuery({
    queryKey: ["raw-materials", idMaterial],
    queryFn: () => fetchMaterialsById(idMaterial!),
    enabled: !!idMaterial,
    throwOnError: true,
  });

  const createMaterialsMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menambahkan material.");
    },
  });

  const updateMaterialsMutation = useMutation({
    mutationFn: ({
      idMaterial,
      data,
    }: {
      idMaterial: string;
      data: UpdateMaterialsSchemaInput;
    }) => updateRawMaterial(idMaterial!, data),
    onSuccess: () => {
      invalidate();
      toast.success("berhasil mengupdate material.");
    },
  });

  const deleteMaterialsMutation = useMutation({
    mutationFn: (id: string) => deleteRawMaterial(id),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menghapus data material.");
    }
  })

  return {
    dataRawMaterials: getMaterialsData.data,
    isLoadingDataTable: getMaterialsData.isLoading,
    dataRawMaterialList: getMaterialsList.data,
    dataRawMaterialById: getMaterialsDataById.data,

    createMaterialsData: createMaterialsMutation.mutate,
    isCreateMaterials: createMaterialsMutation.isPending,
    updateMaterialsData: updateMaterialsMutation.mutate,
    isUpdatingData: updateMaterialsMutation.isPending,
    deleteMaterialsData: deleteMaterialsMutation.mutate,
  };
};
