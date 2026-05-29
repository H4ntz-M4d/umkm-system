import {
  createCategories,
  deleteCategories,
  fetchCategories,
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

  const createCategoryMutatation = useMutation({
    mutationFn: createCategories,
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil ditambahkan");
    },
  });

  const updateCategoryMutatation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategoriesSchemaInput }) =>
      updateCategories(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil diubah");
    },
  });

  const removeCategoryMutatation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteCategories(id),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil telah berhasil dihapus");
    },
  });

  return {
    getCategoriesData: getCategories.data,
    getCategoriesListData: getCategoriesList.data,
    createCategoriesData: createCategoryMutatation.mutate,
    isCreateCategoriesData: createCategoryMutatation.isPending,
    updateCategoriesData: updateCategoryMutatation.mutate,
    isUpdateCategoriesData: updateCategoryMutatation.isPending,
    removeCategoriesData: removeCategoryMutatation.mutate,
    isRemoveCategoriesData: removeCategoryMutatation.isPending,
  };
};
