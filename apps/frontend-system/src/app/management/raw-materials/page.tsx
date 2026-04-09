"use client";

import { InputGroupInlineStart } from "@/components/ui/search";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useState } from "react";
import { useMaterialsOperations } from "@/hooks/management/raw-materials/use-materials-operation";
import { DataTableRawMaterials } from "@/components/management/raw-materials/data-table";
import { columnsRawMaterials } from "@/components/management/raw-materials/columns";
import { useDebounce } from "@/hooks/use-debounce";
import RawMaterialForm from "@/components/management/raw-materials/materials-form";
import { Toaster } from "@/components/ui/sonner";

export default function Page() {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [idData, setIdData] = useState<string | null>();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const {
    dataRawMaterials,
    dataRawMaterialById,
    isLoadingDataTable,
    createMaterialsData,
    isCreateMaterials,
    updateMaterialsData,
    isUpdatingData,
    deleteMaterialsData,
  } = useMaterialsOperations({
    pagination: pagination,
    search: debouncedSearch,
    idMaterial: idData,
  });
  const pageCount = dataRawMaterials?.total
    ? Math.ceil(dataRawMaterials?.total / pagination.pageSize)
    : -1;

  const deleteById = (id: string) => {
    deleteMaterialsData(id);
  };

  return (
    <>
      <div className={"flex flex-1 flex-col gap-4 p-4 pt-0"}>
        <div className="flex sm:flex-row flex-col gap-2 justify-between mt-5">
          <InputGroupInlineStart
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <RawMaterialForm
            initialData={dataRawMaterialById?.data}
            onSubmit={(formData) => {
              if (idData) {
                updateMaterialsData({ idMaterial: idData, data: formData });
              } else {
                createMaterialsData(formData);
              }
            }}
            onOpenChange={(open) => !open && setIdData(undefined)}
            isSubmitting={idData ? isUpdatingData : isCreateMaterials}
          />
        </div>
        <div className={"bg-muted/50 rounded-xl md:min-h-min"}>
          {isLoadingDataTable ? (
            <div className={"p-8 text-center"}>Loading Data...</div>
          ) : (
            <DataTableRawMaterials
              columns={columnsRawMaterials(setIdData, deleteById)}
              data={dataRawMaterials?.data ?? []}
              pageCount={pageCount}
              pagination={pagination}
              onPaginationChange={onPaginationChange}
            />
          )}
        </div>
      </div>
      <Toaster />
    </>
  );
}
