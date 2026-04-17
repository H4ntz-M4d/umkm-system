"use client";

import CardSummary from "./card-summary";
import TableView from "./table-view";
import { useLedgerOperation } from "@/hooks/management/inventory-ledgers/use-ledgers-operation";
import { LedgerFilters } from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";
import { InventoryLedgerResponse, z } from "@repo/schemas";
import { useSearchParams } from "next/navigation";

type InventoryLedgerData = z.infer<typeof InventoryLedgerResponse>;

export default function LedgerView() {
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1
  const limit = Number(searchParams.get("limit")) || 10
  
  const filters: LedgerFilters = {
    skip: (page - 1) * limit,
    limit: limit,
    search: searchParams.get("search") || "",
    itemType: searchParams.get("itemType") || "",
    direction: searchParams.get("direction") || "",
    source: searchParams.get("source") || "",
  }
  const { dataLedger, isLoadingLedger } = useLedgerOperation(filters);
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-5">
          <CardSummary />
        </div>
        <TableView data={dataLedger as InventoryLedgerData} isLoading={isLoadingLedger} currentFilters={filters}/>
      </div>
    </>
  );
}
