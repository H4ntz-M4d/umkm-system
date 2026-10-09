"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchPosVariantBySku } from "@/lib/queries/products/products.query";

/**
 * Pencarian SKU sesuai permintaan, dipakai kasir hanya saat barcode yang
 * discan tidak ada di daftar produknya.
 *
 * Lewat `fetchQuery`, bukan `useQuery`: pemicunya kejadian scan, bukan render.
 * `staleTime: 0` karena yang ditanyakan justru stok terkini — jawaban dari
 * scan sebelumnya bisa sudah basi.
 */
export function usePosSkuLookup(storeId?: string | null) {
  const qc = useQueryClient();

  return useCallback(
    (sku: string) =>
      qc.fetchQuery({
        queryKey: ["pos-products", "by-sku", sku, storeId ?? null],
        queryFn: () => fetchPosVariantBySku(sku, storeId ?? undefined),
        staleTime: 0,
      }),
    [qc, storeId],
  );
}
