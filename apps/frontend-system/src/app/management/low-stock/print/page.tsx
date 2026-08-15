"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { dayjs } from "@repo/utils";
import { LOW_STOCK_THRESHOLD } from "@repo/schemas";
import PrintTablePage from "@/components/management/print/print-table-page";
import { fetchLowStock } from "@/lib/queries/inventory-ledgers/low-stock.query";
import { PRINT_LIMIT } from "@/components/management/print/print-range";

const TYPE_LABEL: Record<string, string> = {
  READY_STOCK: "Ready Stock",
  MADE_TO_ORDER: "Made To Order",
  PRE_ORDER: "Pre Order",
};

export default function Page() {
  const searchParams = useSearchParams();

  const filters = {
    skip: 0,
    limit: PRINT_LIMIT,
    search: searchParams.get("search") || "",
    storeId: searchParams.get("storeId") || "",
  };

  const { data, isLoading } = useQuery({
    queryKey: ["low-stock-print", filters],
    queryFn: () => fetchLowStock(filters),
  });

  return (
    <PrintTablePage
      title="Laporan Stok Rendah"
      subtitle={`Varian dengan sisa stok di bawah ${LOW_STOCK_THRESHOLD}`}
      headers={[
        "Toko",
        "Produk",
        "Varian",
        "SKU",
        "Tipe produk",
        "Sisa stok",
        "Terakhir berubah",
      ]}
      numericFrom={5}
      isLoading={isLoading}
      rows={(data?.data ?? []).map((item) => [
        item.storeName,
        item.productName,
        item.variantLabel || "-",
        item.sku,
        TYPE_LABEL[item.type] ?? item.type,
        item.stock,
        dayjs(item.updatedAt).locale("id").format("DD MMM YYYY"),
      ])}
    />
  );
}
