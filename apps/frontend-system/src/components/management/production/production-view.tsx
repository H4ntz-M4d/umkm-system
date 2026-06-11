import { InputGroupInlineStart } from "@/components/ui/search";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductionData, z } from "@repo/schemas";
import { columnsProduction } from "./column";
import { DataTableProduction } from "./data-table";
import { ProductionFilters } from "@/lib/queries/production/production.query";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ProductionTypeData = z.infer<typeof ProductionData>;

interface ProductionViewProps {
  dataProduction: any;
  isLoadingDataProduction: boolean;
  filters: ProductionFilters;
  setIdData: (id: string | undefined) => void;
}

export default function ProductionView({
  dataProduction,
  isLoadingDataProduction,
  filters,
  setIdData,
}: ProductionViewProps) {
  const [search, setSearch] = useState("");
  const { deleteProductionData } = useProductionOperation({});
  const debouncedSearch = useDebounce(search, 500);
  const { pagination, onPaginationChange } = usePaginationParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();
  const pageCount = dataProduction?.total
    ? Math.ceil(dataProduction.total / pagination.pageSize)
    : 1;
  const deleteData = (id: string) => {
    deleteProductionData(id);
  };

  const updateUrl = async (
    newParams: Record<string, string | number | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== undefined) {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathName}?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      updateUrl({
        search: debouncedSearch,
        skip: 0,
      });
    }
  }, [debouncedSearch, filters.search, updateUrl]);
  return (
    <>
      <div>
        <Tabs
          defaultValue={"ALL"}
          value={filters.type || "ALL"}
          onValueChange={(val) => {
            if (val === "ALL") {
              updateUrl({
                type: "",
                skip: 0,
              });
            } else {
              updateUrl({
                type: val,
                skip: 0,
              });
            }
          }}
        >
          <TabsList className="bg-primary-foreground rounded-md w-[40%] justify-start h-auto lg:h-10 gap-1 p-1">
            <TabsTrigger
              value={"ALL"}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary/20"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value={"RESTOCK"}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary/10"
            >
              Isi Stock
            </TabsTrigger>
            <TabsTrigger
              value={"MADE_TO_ORDER"}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary/20"
            >
              Made To Order
            </TabsTrigger>
            <TabsTrigger
              value={"BE_SPOKE"}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary/20"
            >
              Produksi Custom
            </TabsTrigger>
            <TabsTrigger
              value={"PRE_ORDER"}
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-secondary/20"
            >
              Pre Order
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex flex-wrap gap-3">
        <InputGroupInlineStart
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={filters.status}
          onValueChange={(val) => {
            if (val === "none") {
              updateUrl({ status: "", skip: 0 });
            } else {
              updateUrl({ status: val, skip: 0 });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="none">Semua Status</SelectItem>
              <SelectItem value="PLANNED">Di Rencanakan</SelectItem>
              <SelectItem value="IN_PROGRESS">Proses</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Batal</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className={"bg-muted/50 rounded-xl md:min-h-min"}>
        {isLoadingDataProduction ? (
          <div className={"p-8 text-center"}>Loading data ...</div>
        ) : (
          <DataTableProduction
            columns={columnsProduction(setIdData, deleteData)}
            data={dataProduction?.data ?? []}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
          />
        )}
      </div>
    </>
  );
}
