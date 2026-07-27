import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  fetchPosProductList,
  fetchProduct,
  fetchProductById,
  fetchProductVariantList,
  updateProduct,
  uploadImage,
} from "@/lib/queries/products/products.query";
import { toast } from "sonner";
import { CreateProductSchemaInput } from "@repo/schemas";

export interface PosFilters {
  search?: string;
  categoryId?: string;
}

export function useProductsOperation({
  pagination,
  search,
  idProduct,
  enabledProductVariantList = false,
  enabledPosProductLists = false,
  posFilters,
}: {
  pagination?: { pageIndex: number; pageSize: number };
  search?: string | undefined;
  idProduct?: string | undefined;
  enabledProductVariantList?: boolean;
  enabledPosProductLists?: boolean;
  posFilters?: PosFilters;
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
    enabled: enabledProductVariantList,
  });

  const getProductsById = useQuery({
    queryKey: ["products", idProduct, "details"],
    queryFn: () => fetchProductById(idProduct!),
    enabled: !!idProduct,
  });

  const getPosProductList = useQuery({
    queryKey: ["pos-products", "list", posFilters ?? {}],
    queryFn: () => fetchPosProductList(posFilters ?? {}),
    enabled: enabledPosProductLists,
    throwOnError: true,
  });

  // Pesan dari backend sudah dibuka apiFetcher jadi err.message. Ditampilkan
  // sebagai description supaya peringatan panjang tetap terbaca utuh.
  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menyimpan data produk");
    },
    onError: showError("Gagal menyimpan data produk"),
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
      invalidate();
      toast.success("Berhasil menyimpan data produk");
    },
    onError: showError("Gagal menyimpan data produk"),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      invalidate();
      toast.success("Berhasil menghapus data produk");
    },
    onError: showError("Gagal menghapus data produk"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: ({
      productId,
      imageGroupIds,
      files,
    }: {
      productId: string;
      imageGroupIds: string[];
      files: File[];
    }) => uploadImage({ productId, imageGroupIds, files }),
    onSuccess: () => {
      invalidate();
      // Grid POS membaca gambar yang sama, cache-nya ikut basi.
      void qc.invalidateQueries({ queryKey: ["pos-products"] });
    },
    onError: showError("Gagal mengunggah gambar"),
  });

  return {
    fetchProductData: getProducts.data,
    getProductsDataById: getProductsById.data,
    fetchProductVariantList: getProductVariantList.data,
    fetchPosProductListData: getPosProductList.data,
    isPosProductLoading: getPosProductList.isLoading,
    isLoadingProduct: getProducts.isLoading,
    createProductData: createProductMutation.mutateAsync,
    updateProductData: updateProductMutation.mutateAsync,
    uploadImageData: uploadImageMutation.mutateAsync,
    deleteProductData: deleteProductMutation.mutate,
  };
}
