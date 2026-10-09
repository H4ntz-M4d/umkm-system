"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { dayjs } from "@repo/utils";
import PrintTablePage from "@/components/management/print/print-table-page";
import { fetchExpense } from "@/lib/queries/expense/expense.query";
import { toIDR } from "../../../../../utils/format-money";
import {
  PRINT_LIMIT,
  printSubtitle,
} from "@/components/management/print/print-range";

export default function Page() {
  const searchParams = useSearchParams();
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const filters = {
    skip: 0,
    limit: PRINT_LIMIT,
    search: searchParams.get("search") || "",
    category: searchParams.get("category") || "",
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["expense-print", filters],
    queryFn: () => fetchExpense(filters),
  });

  return (
    <PrintTablePage
      title="Laporan Pengeluaran"
      subtitle={printSubtitle(dateFrom, dateTo)}
      headers={["Tanggal", "Kategori", "Keterangan", "Diinput oleh", "Jumlah"]}
      /// Digeser mengikuti kolom baru; kalau tertinggal, kolom "Diinput oleh"
      /// ikut rata kanan seolah-olah angka.
      numericFrom={4}
      isLoading={isLoading}
      rows={(data?.data ?? []).map((item) => [
        dayjs(item.date).locale("id").format("DD MMM YYYY"),
        item.categoryName ?? "-",
        item.description ?? "-",
        item.createdByName ?? "-",
        toIDR(item.totalAmount),
      ])}
    />
  );
}
