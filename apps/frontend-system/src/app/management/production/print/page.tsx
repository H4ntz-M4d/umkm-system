"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { dayjs } from "@repo/utils";
import PrintTablePage from "@/components/management/print/print-table-page";
import { fetchProductionData } from "@/lib/queries/production/production.query";
import {
  PRINT_LIMIT,
  printSubtitle,
} from "@/components/management/print/print-range";

const TYPE_LABEL: Record<string, string> = {
  RESTOCK: "Isi Stock",
  MADE_TO_ORDER: "Made To Order",
  BE_SPOKE: "Produksi Custom",
  PRE_ORDER: "Pre Order",
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Di Rencanakan",
  IN_PROGRESS: "Proses",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
};

export default function Page() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const filters = {
    skip: 0,
    limit: PRINT_LIMIT,
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "",
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["production-print", filters],
    queryFn: () => fetchProductionData(filters),
  });

  return (
    <PrintTablePage
      title="Laporan Produksi"
      subtitle={printSubtitle(dateFrom, dateTo)}
      headers={["Tanggal", "Produk", "SKU", "Tipe", "Status", "Jumlah"]}
      numericFrom={5}
      isLoading={isLoading}
      rows={(data?.data ?? []).map((item) => [
        dayjs(item.createdAt).locale("id").format("DD MMM YYYY"),
        item.productName ?? "-",
        item.sku ?? "-",
        TYPE_LABEL[item.type] ?? item.type,
        STATUS_LABEL[item.status] ?? item.status,
        item.quantityProduced,
      ])}
    />
  );
}
