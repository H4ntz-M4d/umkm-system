"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { dayjs } from "@repo/utils";
import { fetchProductions } from "@/lib/queries/production/production.query";
import PrintTablePage from "@/components/management/print/print-table-page";
import {
  PRINT_LIMIT,
  printSubtitle,
} from "@/components/management/print/print-range";
import { PRODUCTION_STATUS_LABEL } from "@/components/management/production/column";

export default function Page() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") || undefined;
  const dateTo = searchParams.get("dateTo") || undefined;

  const filters = {
    page: 0,
    limit: PRINT_LIMIT,
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["production-print", filters],
    queryFn: () => fetchProductions(filters),
  });

  return (
    <PrintTablePage
      title="Laporan Produksi"
      subtitle={printSubtitle(dateFrom, dateTo)}
      headers={[
        "Kode batch",
        "Target selesai",
        "Status",
        "Varian",
        "Target",
        "Sudah masuk",
      ]}
      numericFrom={3}
      isLoading={isLoading}
      rows={(data?.data ?? []).map((item) => [
        item.code,
        dayjs(item.targetDate).locale("id").format("DD MMM YYYY"),
        PRODUCTION_STATUS_LABEL[item.status] ?? item.status,
        item.variantCount,
        item.totalTarget,
        item.totalDelivered,
      ])}
    />
  );
}
