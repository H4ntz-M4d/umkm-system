"use client";

import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ProductionFilters } from "@/lib/queries/production/production.query";
import ProductionModalForm from "@/components/management/production/form-input";
import CardSummaryProduction from "@/components/management/production/card-summary-production";
import ExportButtons from "@/components/management/export-buttons";
import ProductionView from "@/components/management/production/production-view";
import { ProductionBeSpokeSchemaInput } from "@repo/schemas";

export default function Page() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = Number(searchParams.get("limit")) || 10;
  const filters: ProductionFilters = {
    skip: (page - 1) * limit,
    limit: limit,
    search: searchParams.get("search") || "",
    type: searchParams.get("type") || "",
    status: searchParams.get("status") || "",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
  };

  /// Filter yang sedang aktif ikut dibawa ke ekspor dan cetak, tanpa paginasi.
  const activeParams = new URLSearchParams(
    Object.entries({
      search: filters.search,
      type: filters.type,
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }).filter(([, value]) => value) as [string, string][],
  ).toString();

  const { dataProduction, isLoadingDataProduction } = useProductionOperation({
    filters,
    isTableMode: true,
  });
  const [idData, setIdData] = useState<string | undefined>("");

  const selectProductionData = dataProduction?.data?.find(
    (data) => idData === data.id,
  );

  return (
    <>
      <div className={"flex flex-1 flex-col gap-4 p-6 pt-0"}>
        <div className={"flex sm:flex-row flex-col gap-2 justify-between mt-5"}>
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl md:text-3xl lg:text-4xl">Produksi</h2>
            <p className="text-sm text-muted-foreground">
              Rencanakan produksi produk anda
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButtons
              excelPath={`v1/production/export?${activeParams}`}
              fallbackName="produksi"
              printPath={`/management/production/print?${activeParams}`}
            />
            <ProductionModalForm
              initalData={selectProductionData as ProductionBeSpokeSchemaInput}
              id={idData}
              onOpenChange={(open) => !open && setIdData(undefined)}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          <CardSummaryProduction />
        </div>
        <ProductionView
          dataProduction={dataProduction}
          isLoadingDataProduction={isLoadingDataProduction}
          filters={filters}
          setIdData={setIdData}
        />
      </div>
      <Toaster />
    </>
  );
}
