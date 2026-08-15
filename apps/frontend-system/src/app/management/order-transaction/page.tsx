"use client";

import PosTransactionView from "@/components/management/order-transaction/pos/pos-transaction-view";
import OrderListView from "@/components/management/order-transaction/online/order-list-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { OrderFilters } from "@/lib/queries/order/order.query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import SummaryTransactionPosAndOrder from "@/components/management/order-transaction/summary-transaction-pos-and-order";
import ExportButtons from "@/components/management/export-buttons";

export default function Page() {
  const searchParams = useSearchParams();
  const { pagination, onPaginationChange } = usePaginationParams();
  const [posDateFrom, posDateTo] = (
    searchParams.get("posTransactioDate") || ""
  ).split(",");
  const posFilters: PosTransactionFilters = {
    search: searchParams.get("posTransactioSearch") || "",
    status: searchParams.get("posTransactioStatus") || "",
    paymentChannel: searchParams.get("posTransactioPaymentChannel") || "",
    storeId: searchParams.get("posTransactioStore") || "",
    dateFrom: posDateFrom || "",
    dateTo: posDateTo || "",
    page: pagination.pageIndex,
    limit: pagination.pageSize,
  };
  const [orderDateFrom, orderDateTo] = (
    searchParams.get("orderDate") || ""
  ).split(",");
  const orderFilters: OrderFilters = {
    search: searchParams.get("orderSearch") || "",
    status: searchParams.get("orderStatus") || "",
    store: searchParams.get("orderStore") || "",
    dateFrom: orderDateFrom || "",
    dateTo: orderDateTo || "",
  };
  const router = useRouter();
  const pathName = usePathname();

  const currentTab = searchParams.get("tab") || "order-online";

  /**
   * Nama parameter kedua kanal berbeda di URL halaman ini (`posTransactio*` vs
   * `order*`), tapi endpoint-nya menerima nama baku. Pemetaan dilakukan di sini
   * supaya berkas yang keluar menyaring persis seperti tabel yang dilihat.
   */
  const toParams = (entries: Record<string, string | undefined>) =>
    new URLSearchParams(
      Object.entries(entries).filter(([, value]) => value) as [
        string,
        string,
      ][],
    ).toString();

  const posExportParams = toParams({
    search: posFilters.search,
    status: posFilters.status,
    storeId: posFilters.storeId,
    dateFrom: posFilters.dateFrom,
    dateTo: posFilters.dateTo,
  });

  const orderExportParams = toParams({
    search: orderFilters.search,
    status: orderFilters.status,
    store: orderFilters.store,
    dateFrom: orderFilters.dateFrom,
    dateTo: orderFilters.dateTo,
  });

  const updateParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value.toString());
        }
      });

      router.replace(`${pathName}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathName],
  );

  const handleUpdateParamsSelection = (
    key: string,
    val: string | number | undefined,
  ) => {
    if (val === "none" || val === "") {
      updateParams({ [key]: "", page: 0 });
    } else {
      updateParams({ [key]: val, page: 0 });
    }
  };

  const handleTabChange = (val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", val);
    params.set("page", "0");
    router.push(`${pathName}?${params.toString()}`);
  };
  return (
    <main className="flex flex-col flex-1 gap-4 py-4 px-6 pt-0">
      <div className="my-5 flex flex-row justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-4xl font-instrument">Transaksi Pesanan</h2>
          <p className="text-sm text-accent-foreground">
            List transaksi dari pesanan online dan transaksi kasir
          </p>
        </div>
        {/* Mengikuti tab yang sedang dibuka: yang diekspor dan dicetak adalah
            kanal yang sedang dilihat, dengan filternya sendiri. */}
        {currentTab === "pos-transaction" ? (
          <ExportButtons
            excelPath={`v1/pos-transactions/export?${posExportParams}`}
            fallbackName="transaksi-kasir"
            printPath={`/management/order-transaction/print?channel=pos&${posExportParams}`}
          />
        ) : (
          <ExportButtons
            excelPath={`v1/orders/export?${orderExportParams}`}
            fallbackName="pesanan-online"
            printPath={`/management/order-transaction/print?channel=online&${orderExportParams}`}
          />
        )}
      </div>
      <SummaryTransactionPosAndOrder />
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-5">
          <TabsTrigger value="order-online">Pesanan Online</TabsTrigger>
          <TabsTrigger value="pos-transaction">Transaksi Kasir</TabsTrigger>
        </TabsList>
        <TabsContent value="order-online">
          <OrderListView
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            orderFilters={orderFilters}
            handleUpdateParams={handleUpdateParamsSelection}
          />
        </TabsContent>
        <TabsContent value="pos-transaction">
          <PosTransactionView
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            posFilters={posFilters}
            handleUpdateParams={handleUpdateParamsSelection}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
