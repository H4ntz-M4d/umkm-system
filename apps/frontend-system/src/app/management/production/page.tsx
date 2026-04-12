"use client";

import { InputGroupInlineStart } from "@/components/ui/search";
import { DataTableProduction } from "@/components/management/production/data-table";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { columnsProduction } from "@/components/management/production/column";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ProductionModalForm from "@/components/management/production/form-input";

export default function Page() {
  const router = useRouter();
  const { pagination, onPaginationChange } = usePaginationParams();
  const { dataProduction, isLoadingDataProduction, deleteProductionData } = useProductionOperation({
    pagination,
  });
  const pageCount = dataProduction?.total
    ? Math.ceil(dataProduction.total / pagination.pageSize)
    : 1;

  const [idData, setIdData] = useState<string | undefined>("");
  const [open, setOpen] = useState<boolean>(false);
  const deleteData = (id: string) => {
    deleteProductionData(id);
  };

  const selectProductionData = dataProduction?.data?.find(
    (data) => idData === data.id,
  );

  return (
    <>
      <div className={"flex flex-1 flex-col gap-4 p-4 pt-0"}>
        <div className={"flex sm:flex-row flex-col gap-2 justify-between mt-5"}>
          <InputGroupInlineStart />
          <Button
            type={"button"}
            onClick={() => router.push("/management/production/new")}
          >
            Add Production
          </Button>
        </div>
        <ProductionModalForm
          initalData={selectProductionData}
          open={open}
          setOpen={setOpen}
          id={idData}
        />
        <div className={"bg-muted/50 rounded-xl md:min-h-min"}>
          {isLoadingDataProduction ? (
            <div className={"p-8 text-center"}>Loading data ...</div>
          ) : (
            <DataTableProduction
              columns={columnsProduction(setIdData, deleteData, setOpen)}
              data={dataProduction?.data ?? []}
              pageCount={pageCount}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
