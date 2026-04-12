import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProductById,
  fetchProductVariantList,
  updateProduct,
  uploadImage,
} from "@/lib/queries/products/products.query";
import { toast } from "sonner";
import { CreateProductSchemaInput } from "@repo/schemas";

export function useProductsOperation({
  pagination,
  search,
  idProduct,
  enabledProductVariantList = false,
}: {
  pagination?: { pageIndex: number; pageSize: number };
  search?: string | undefined;
  idProduct?: string | undefined;
  enabledProductVariantList?: boolean;
}) {
  const qc = useQueryClient();
  const isTableMode = !!pagination;
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products"] });

  const getProducts = useQuery({
    queryKey: ["products", pagination?.pageIndex, pagination?.pageSize, search],
    queryFn: () =>
      fetchProduct(pagination!.pageIndex, pagination!.pageSize, search),
    enabled: isTableMode,
    throwOnError: true,
  });

  const getProductVariantList = useQuery({
    queryKey: ["products-variants"],
    queryFn: () => fetchProductVariantList(),
    enabled: enabledProductVariantList
  });

  const getProductsById = useQuery({
    queryKey: ["products", idProduct, "details"],
    queryFn: () => fetchProductById(idProduct!),
    enabled: !!idProduct,
  });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menyimpan data produk");
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CreateProductSchemaInput;
    }) => updateProduct(id, data),
    onSuccess: () => {
      toast.success("Berhasil menyimpan data produk");
    },
    onError: (err) => {
      console.log(err);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menghapus data produk");
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({
      productId,
      variantIds,
      files,
    }: {
      productId: string;
      variantIds: string[];
      files: File[];
    }) => uploadImage({ productId, variantIds, files }),
    onSuccess: () => {
      invalidate();
    },
  });

  return {
    fetchProductData: getProducts.data,
    getProductsDataById: getProductsById.data,
    fetchProductVariantList: getProductVariantList.data,
    isLoadingProduct: getProducts.isLoading,
    createProductData: createProductMutation.mutateAsync,
    updateProductData: updateProductMutation.mutateAsync,
    uploadImageData: uploadImageMutation.mutate,
    deleteProductData: deleteProductMutation.mutate,
  };
}
