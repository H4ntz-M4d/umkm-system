import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { DataTableLedgers } from "../data-table";
import { columnsLedgers } from "../columns";
import { LedgerFilters } from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";
import { useCallback, useEffect, useState } from "react";
import { usePaginationParams } from "@/hooks/use-paginations-params";
import { useDebounce } from "@/hooks/use-debounce";
import { InventoryLedgerResponse, z } from "@repo/schemas";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const ledgerSource = [
  {
    value: "PRODUCTION",
    label: "Produksi",
  },
  {
    value: "ONLINE_ORDER",
    label: "Transaksi Online",
  },
  {
    value: "POS",
    label: "Transaksi Kasir",
  },
  {
    value: "PURCHASE",
    label: "Pembelian",
  },
  {
    value: "ADJUSTMENT",
    label: "Pengaturan",
  },
];

type InventoryLedgerData = z.infer<typeof InventoryLedgerResponse>;

interface TableViewProps {
  data: InventoryLedgerData;
  isLoading: boolean;
  currentFilters: LedgerFilters;
}

export default function TableView({
  data,
  isLoading,
  currentFilters,
}: TableViewProps) {
  const { pagination, onPaginationChange } = usePaginationParams();
  const [searchData, setSearchData] = useState(currentFilters.search);
  const debouncedSearch = useDebounce(searchData, 500);
  const pathName = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.set(key, value.toString());
        } else {
          params.delete(key);
        }
      });

      router.push(`${pathName}?${params.toString()}`, { scroll: false });
    },
    [pathName, router, searchParams],
  );

  useEffect(() => {
    if (debouncedSearch !== currentFilters.search) {
      updateUrl({
        search: debouncedSearch,
        skip: 0,
      });
    }
  }, [debouncedSearch, currentFilters.search, updateUrl]);

  const pageCount = data?.meta?.total
    ? Math.ceil(data?.meta?.total / pagination.pageSize)
    : 1;

  return (
    <>
      <div className="flex lg:flex-row flex-col-reverse items-center justify-between gap-3 mt-5 bg-primary-foreground py-3 px-4 rounded-md shadow">
        <InputGroup className="lg:max-w-sm w-full bg-background">
          <InputGroupInput
            placeholder="Cari data"
            value={searchData}
            onChange={(e) => setSearchData(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <div className="flex md:flex-row flex-col lg:justify-end justify-center items-center gap-3 w-full">
          <Select
            value={currentFilters.itemType}
            onValueChange={(value) => {
              if (value === "none") {
                updateUrl({ itemType: "", skip: 0 });
              } else {
                updateUrl({ itemType: value, skip: 0 });
              }
            }}
          >
            <SelectTrigger className="lg:w-40 w-full bg-background" size="lg">
              <SelectValue placeholder="Tipe Item" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua Tipe</SelectItem>
              <SelectItem value="PRODUCT_VARIANT">Variant Produk</SelectItem>
              <SelectItem value="RAW_MATERIAL">Bahan Baku</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={currentFilters.direction}
            onValueChange={(value) => {
              if (value === "none") {
                updateUrl({ direction: "", skip: 0 });
              } else {
                updateUrl({ direction: value, skip: 0 });
              }
            }}
          >
            <SelectTrigger className="lg:w-40 w-full bg-background" size="lg">
              <SelectValue placeholder="Perubahan Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua Perubahan</SelectItem>
              <SelectItem value="IN">Masuk</SelectItem>
              <SelectItem value="OUT">Keluar</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={currentFilters.source}
            onValueChange={(value) => {
              if (value === "none") {
                updateUrl({ source: "", skip: 0 });
              } else {
                updateUrl({ source: value, skip: 0 });
              }
            }}
          >
            <SelectTrigger className="lg:w-40 w-full bg-background" size="lg">
              <SelectValue placeholder="Sumber Data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Semua Sumber</SelectItem>
              {ledgerSource.map((item, index) => (
                <SelectItem key={index} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-muted/50 rounded-xl md:min-h-min">
        {isLoading ? (
          <p className="text-center">Loading ...</p>
        ) : (
          <DataTableLedgers
            columns={columnsLedgers()}
            data={data?.data ?? []}
            pagination={pagination}
            onPaginationChange={onPaginationChange}
            pageCount={pageCount}
          />
        )}
      </div>
    </>
  );
}
