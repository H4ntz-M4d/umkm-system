import {
  applyAdjustment,
  fetchAdjustmentRows,
} from "@/lib/queries/stock-adjustment/stock-adjustment.query";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const useStockAdjustment = ({
  storeId,
  search,
  enabled = false,
}: {
  storeId?: string | null;
  search?: string;
  enabled?: boolean;
}) => {
  const qc = useQueryClient();

  const rows = useQuery({
    queryKey: ["stock-adjustment", storeId ?? "own", search ?? ""],
    queryFn: () => fetchAdjustmentRows({ storeId, search }),
    enabled,
  });

  const applyMutation = useMutation({
    mutationFn: applyAdjustment,
    onSuccess: (data) => {
      /// Stok berubah, jadi daftar varian dan riwayat stok ikut dimuat ulang.
      qc.invalidateQueries({ queryKey: ["stock-adjustment"] });
      qc.invalidateQueries({ queryKey: ["inventory-ledgers"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(`Stok ${data.changedCount} varian diperbarui`, {
        description: `Tercatat dengan nomor ${data.code} di ${data.storeName}.`,
      });
    },
    onError: (err: Error) =>
      toast.error("Gagal menyimpan penyesuaian", { description: err.message }),
  });

  return {
    adjustmentData: rows.data,
    isLoadingRows: rows.isLoading,
    applyAdjustmentData: applyMutation.mutateAsync,
    isApplying: applyMutation.isPending,
  };
};
