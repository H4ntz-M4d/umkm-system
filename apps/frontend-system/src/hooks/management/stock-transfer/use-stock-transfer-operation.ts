import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cancelStockTransfer,
  createStockTransfer,
  fetchStockTransfers,
  receiveStockTransfer,
  sendStockTransfer,
  StockTransferFilters,
} from "@/lib/queries/stock-transfer/stock-transfer.query";

export const useStockTransferOperation = (filters: StockTransferFilters) => {
  const qc = useQueryClient();

  /**
   * Ikut menyegarkan stok rendah dan inventori, bukan hanya daftar kiriman.
   *
   * Mengirim dan menerima menggerakkan stok di dua toko sekaligus, jadi
   * halaman lain yang menampilkan angka stok akan basi kalau tidak ikut
   * ditandai — dan angka stok yang basi persis jenis kesalahan yang tidak
   * terlihat salah.
   */
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["stock-transfer"] });
    qc.invalidateQueries({ queryKey: ["low-stock"] });
    qc.invalidateQueries({ queryKey: ["inventory-ledgers"] });
  };

  const listQuery = useQuery({
    queryKey: ["stock-transfer", filters],
    queryFn: () => fetchStockTransfers(filters),
    placeholderData: keepPreviousData,
  });

  /// Pesan galat dari server ditampilkan apa adanya — di situlah keterangan
  /// kekurangan stok per produk berada, dan itu yang perlu dibaca admin.
  const onError = (error: Error) =>
    toast.error(error.message, { position: "top-center" });

  const createMutation = useMutation({
    mutationFn: createStockTransfer,
    onSuccess: () => {
      invalidate();
      toast.success("Kiriman berhasil dibuat", { position: "top-center" });
    },
    onError,
  });

  const sendMutation = useMutation({
    mutationFn: sendStockTransfer,
    onSuccess: () => {
      invalidate();
      toast.success("Barang ditandai sudah dikirim", {
        position: "top-center",
      });
    },
    onError,
  });

  const receiveMutation = useMutation({
    mutationFn: receiveStockTransfer,
    onSuccess: () => {
      invalidate();
      toast.success("Barang diterima, stok toko tujuan bertambah", {
        position: "top-center",
      });
    },
    onError,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelStockTransfer,
    onSuccess: () => {
      invalidate();
      toast.success("Kiriman dibatalkan", { position: "top-center" });
    },
    onError,
  });

  return {
    transfersData: listQuery.data,
    isLoadingTransfers: listQuery.isLoading,

    createTransfer: createMutation.mutate,
    isCreating: createMutation.isPending,
    sendTransfer: sendMutation.mutate,
    receiveTransfer: receiveMutation.mutate,
    cancelTransfer: cancelMutation.mutate,
    isMoving:
      sendMutation.isPending ||
      receiveMutation.isPending ||
      cancelMutation.isPending,
  };
};
