import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { PaginationState } from "@tanstack/react-table";

interface UsePaginationParamsOptions {
  defaultPageSize?: number;
}

export function usePaginationParams(options: UsePaginationParamsOptions = {}) {
  const { defaultPageSize = 10 } = options;
  const router = useRouter();
  const searchParams = useSearchParams();

  // 1. DERIVE STATE: Hitung nilai langsung dari URL saat render. 
  // Tidak perlu useState atau useEffect.
  const pageIndex = (Number(searchParams.get("page")) || 1) - 1;
  const pageSize = Number(searchParams.get("pageSize")) || defaultPageSize;

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize]
  );

  // 2. UPDATE URL: Fungsi ini menggantikan setPagination
  const onPaginationChange = useCallback(
    (updaterOrValue: any) => {
      // Handle jika updater berupa function (standar React state updater)
      const nextPagination =
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue;

      const params = new URLSearchParams(searchParams.toString());
      
      // Update URL parameters
      params.set("page", String(nextPagination.pageIndex + 1));
      params.set("pageSize", String(nextPagination.pageSize));

      // Gunakan replace agar history browser tidak penuh sampah (opsional, bisa juga push)
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [pagination, router, searchParams]
  );

  return {
    pagination,
    onPaginationChange,
  };
}