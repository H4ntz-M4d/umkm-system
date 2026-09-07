import {
  createCategories,
  deleteCategories,
  fetchCategories,
  fetchCategoriesSummary,
  fetchCategoryList,
  updateCategories,
} from "@/lib/queries/categories/categories.query";
import { CategoriesSchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useCategoriesOperation = ({
  search,
  enableGetCategories = false,
  enableGetCategoriesList = false,
}: {
  search?: string;
  enableGetCategories?: boolean;
  enableGetCategoriesList?: boolean;
}) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const getCategories = useQuery({
    queryKey: ["categories", search],
    queryFn: () => fetchCategories(search ?? ""),
    enabled: enableGetCategories,
  });

  const getCategoriesList = useQuery({
    queryKey: ["categories", "list"],
    queryFn: () => fetchCategoryList(),
    enabled: enableGetCategoriesList,
  });

  const getCategoriesSummary = useQuery({
    queryKey: ["categories"],
    queryFn: () => fetchCategoriesSummary(),
    enabled: enableGetCategories,
  });

  const createCategoryMutatation = useMutation({
    mutationFn: createCategories,
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil ditambahkan");
    },
    onError: showError("Gagal menambahkan kategori"),
  });

  const updateCategoryMutatation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoriesSchemaInput }) =>
      updateCategories(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil diubah");
    },
    onError: showError("Gagal mengubah kategori"),
  });

  const removeCategoryMutatation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCategories(id),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil telah berhasil dihapus");
    },
    onError: showError("Gagal menghapus kategori"),
  });

  return {
    getCategoriesData: getCategories.data,
    getCategoriesListData: getCategoriesList.data,
    getCategoriesSummaryData: getCategoriesSummary.data,
    createCategoriesData: createCategoryMutatation.mutate,
    isCreateCategoriesData: createCategoryMutatation.isPending,
    updateCategoriesData: updateCategoryMutatation.mutate,
    isUpdateCategoriesData: updateCategoryMutatation.isPending,
    removeCategoriesData: removeCategoryMutatation.mutate,
    isRemoveCategoriesData: removeCategoryMutatation.isPending,
  };
};
