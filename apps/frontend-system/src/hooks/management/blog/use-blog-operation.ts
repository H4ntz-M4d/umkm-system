import {
  BlogFilters,
  createBlog,
  createBlogCategory,
  deleteBlog,
  deleteBlogCategory,
  fetchBlogCategories,
  fetchBlogDetail,
  fetchBlogs,
  updateBlog,
  uploadBlogCover,
} from "@/lib/queries/blog/blog.query";
import { BlogCategorySchemaInput, BlogSchemaInput } from "@repo/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useBlogOperation = ({
  filters,
  blogId,
  enableList = false,
  enableDetail = false,
  enableCategories = false,
}: {
  filters?: BlogFilters;
  blogId?: string;
  enableList?: boolean;
  enableDetail?: boolean;
  enableCategories?: boolean;
} = {}) => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["blog"] });

  const showError = (title: string) => (err: Error) =>
    toast.error(title, { description: err.message });

  const list = useQuery({
    queryKey: ["blog", "list", filters],
    queryFn: () => fetchBlogs(filters ?? {}),
    enabled: enableList,
  });

  const detail = useQuery({
    queryKey: ["blog", "detail", blogId],
    queryFn: () => fetchBlogDetail(blogId!),
    enabled: enableDetail && !!blogId,
  });

  const categories = useQuery({
    queryKey: ["blog", "categories"],
    queryFn: () => fetchBlogCategories(),
    enabled: enableCategories,
  });

  const createMutation = useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      invalidate();
      toast.success("Tulisan berhasil disimpan");
    },
    onError: showError("Gagal menyimpan tulisan"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: BlogSchemaInput }) =>
      updateBlog(id, data),
    onSuccess: () => {
      invalidate();
      toast.success("Tulisan berhasil diperbarui");
    },
    onError: showError("Gagal memperbarui tulisan"),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteBlog(id),
    onSuccess: () => {
      invalidate();
      toast.success("Tulisan berhasil dihapus");
    },
    onError: showError("Gagal menghapus tulisan"),
  });

  /// Unggahan sampul dipakai lewat `mutateAsync` karena pemanggilnya perlu
  /// menunggu URL-nya sebelum menaruhnya di form atau menyisipkannya ke isi
  /// tulisan.
  const uploadCoverMutation = useMutation({
    mutationFn: (file: File) => uploadBlogCover(file),
    onError: showError("Gagal mengunggah gambar"),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: BlogCategorySchemaInput) => createBlogCategory(data),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil ditambahkan");
    },
    onError: showError("Gagal menambahkan kategori"),
  });

  const removeCategoryMutation = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteBlogCategory(id),
    onSuccess: () => {
      invalidate();
      toast.success("Kategori berhasil dihapus");
    },
    onError: showError("Gagal menghapus kategori"),
  });

  return {
    blogList: list.data,
    isBlogListLoading: list.isLoading,
    blogDetail: detail.data,
    isBlogDetailLoading: detail.isLoading,
    blogCategories: categories.data ?? [],
    /// Form berpindah halaman setelah tersimpan, jadi yang dibuka adalah
    /// versi async-nya supaya pemanggil bisa menunggu hasilnya.
    createBlogData: createMutation.mutateAsync,
    isCreateBlogData: createMutation.isPending,
    updateBlogData: updateMutation.mutateAsync,
    isUpdateBlogData: updateMutation.isPending,
    removeBlogData: removeMutation.mutate,
    isRemoveBlogData: removeMutation.isPending,
    uploadCoverAsync: uploadCoverMutation.mutateAsync,
    isUploadingCover: uploadCoverMutation.isPending,
    createBlogCategoryData: createCategoryMutation.mutate,
    isCreateBlogCategoryData: createCategoryMutation.isPending,
    removeBlogCategoryData: removeCategoryMutation.mutate,
  };
};
