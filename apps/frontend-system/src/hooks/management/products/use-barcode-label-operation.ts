"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVariantLabel } from "@/lib/queries/products/products.query";

/**
 * Data label barcode satu varian: SKU, harga, dan stok di tiap toko.
 *
 * Hanya berjalan bila `variantId` terisi — dialog cetak mengisinya saat dibuka,
 * sehingga tabel varian yang berisi puluhan baris tidak menembak endpoint ini
 * untuk setiap barisnya.
 */
export function useBarcodeLabelOperation({
  variantId,
}: {
  variantId?: string | null;
}) {
  const getVariantLabel = useQuery({
    queryKey: ["products", "variant-label", variantId],
    queryFn: () => fetchVariantLabel(variantId!),
    enabled: !!variantId,
  });

  return {
    variantLabelData: getVariantLabel.data?.data,
    isLoadingVariantLabel: getVariantLabel.isLoading,
    variantLabelError: getVariantLabel.error,
  };
}
