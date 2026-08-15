"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { dayjs } from "@repo/utils";
import PrintTablePage from "@/components/management/print/print-table-page";
import { fetchOrders } from "@/lib/queries/order/order.query";
import { fetchPosTransactions } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { toIDR } from "../../../../../utils/format-money";
import {
  PRINT_LIMIT,
  printSubtitle,
} from "@/components/management/print/print-range";

/**
 * Satu rute cetak untuk dua kanal, dipilih lewat `?channel=`.
 *
 * Mengikuti tab yang sedang dibuka pengguna: yang dicetak adalah kanal yang
 * sedang mereka lihat, dengan filternya sendiri — bukan gabungan keduanya, yang
 * kolomnya berbeda dan akan memaksa penggabungan yang menyesatkan.
 */
export default function Page() {
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") === "pos" ? "pos" : "online";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const orderFilters = {
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    store: searchParams.get("store") || "",
    dateFrom,
    dateTo,
  };

  const posFilters = {
    skip: 0,
    limit: PRINT_LIMIT,
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    storeId: searchParams.get("storeId") || "",
    dateFrom,
    dateTo,
  };

  const online = useQuery({
    queryKey: ["order-print", orderFilters],
    queryFn: () => fetchOrders(0, PRINT_LIMIT, orderFilters),
    enabled: channel === "online",
  });

  const pos = useQuery({
    queryKey: ["pos-print", posFilters],
    queryFn: () => fetchPosTransactions(posFilters),
    enabled: channel === "pos",
  });

  if (channel === "pos") {
    return (
      <PrintTablePage
        title="Laporan Transaksi Kasir"
        subtitle={printSubtitle(dateFrom, dateTo)}
        headers={["Tanggal", "Nomor transaksi", "Kasir", "Status", "Total"]}
        numericFrom={4}
        isLoading={pos.isLoading}
        rows={(pos.data?.data ?? []).map((item) => [
          dayjs(item.createdAt).locale("id").format("DD MMM YYYY"),
          item.transId,
          item.cashierName ?? "-",
          item.status,
          toIDR(item.totalAmount),
        ])}
      />
    );
  }

  return (
    <PrintTablePage
      title="Laporan Pesanan Online"
      subtitle={printSubtitle(dateFrom, dateTo)}
      headers={["Tanggal", "Nomor pesanan", "Pelanggan", "Status", "Total"]}
      numericFrom={4}
      isLoading={online.isLoading}
      rows={(online.data?.data ?? []).map((item) => [
        dayjs(item.createdAt).locale("id").format("DD MMM YYYY"),
        item.orderId,
        item.customerName ?? "-",
        item.status,
        toIDR(item.totalAmount),
      ])}
    />
  );
}
