import {
  fetchLowStock,
  LowStockFilters,
} from "@/lib/queries/inventory-ledgers/low-stock.query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/**
 * Endpointnya hanya untuk Owner, Admin, dan Gudang. Tidak ada penjagaan role di
 * sini karena pemanggilnya sudah menjaganya lebih awal: halaman Stok Rendah
 * dilindungi `proxy.ts`, dan kartu di dashboard tidak dirender sama sekali untuk
 * role yang tidak berhak — jadi query ini tidak pernah mount tanpa izin.
 */
export const useLowStockOperation = (filters: LowStockFilters) => {
  const getLowStockQuery = useQuery({
    queryKey: ["low-stock", filters],
    queryFn: () => fetchLowStock(filters),
    placeholderData: keepPreviousData,
  });

  return {
    dataLowStock: getLowStockQuery.data,
    isLoadingLowStock: getLowStockQuery.isLoading,
  };
};
