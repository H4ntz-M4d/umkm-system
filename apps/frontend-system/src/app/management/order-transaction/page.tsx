"use client";

import PosTransactionView from "@/components/management/order-transaction/pos/pos-transaction-view";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function Page() {
  const searchParams = useSearchParams();
  const { pagination, onPaginationChange } = usePaginationParams();
  const posFilters: PosTransactionFilters = {
    search: searchParams.get("search") || "",
    status: searchParams.get("status") || "",
    paymentChannel: searchParams.get("paymentChannel") || "",
    storeId: searchParams.get("storeId") || "",
    page: pagination.pageIndex,
    limit: pagination.pageSize,
  };
  const router = useRouter();
  const pathName = usePathname();

  const currentTab = searchParams.get("tab") || "pos-transaction";

  const updateParams = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams);

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined) {
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
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 mb-5">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-5">
          <TabsTrigger value="pos-transaction">Transaksi Kasir</TabsTrigger>
          <TabsTrigger value="order-online">Pesanan Online</TabsTrigger>
        </TabsList>
        <TabsContent value="pos-transaction">
          <PosTransactionView
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            posFilters={posFilters}
            handleUpdateParams={handleUpdateParamsSelection}
          />
        </TabsContent>
        <TabsContent value="order-online">Isi Online Order</TabsContent>
      </Tabs>
    </main>
  );
}
