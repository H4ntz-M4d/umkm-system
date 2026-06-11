"use client";

import { InputGroupInlineStart } from "@/components/ui/search";
import { DataTableProduction } from "@/components/management/production/data-table";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { columnsProduction } from "@/components/management/production/column";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Toaster } from "@/components/ui/sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Timer, TimerIcon, XCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductionFilters } from "@/lib/queries/production/production.query";
import ProductionModalForm from "@/components/management/production/form-input";
import CardSummaryProduction from "@/components/management/production/card-summary-production";
import ProductionView from "@/components/management/production/production-view";

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
  };

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
          <ProductionModalForm
            initalData={selectProductionData}
            id={idData}
            onOpenChange={(open) => !open && setIdData(undefined)}
          />
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
