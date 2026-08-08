"use client";

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
import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/use-debounce";
import { LedgerFilters } from "@/lib/queries/inventory-ledgers/inventory-ledgers.query";

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

interface InventoryLedgerFilterProps {
  currentFilters: LedgerFilters;
  updateUrl: (newParams: Record<string, string | number | undefined>) => void;
}

export default function InventoryLedgerFilter({
  currentFilters,
  updateUrl,
}: InventoryLedgerFilterProps) {
  const [searchData, setSearchData] = useState(currentFilters.search ?? "");
  const debouncedSearch = useDebounce(searchData, 500);

  useEffect(() => {
    if (debouncedSearch !== currentFilters.search) {
      updateUrl({ search: debouncedSearch, skip: 0 });
    }
  }, [debouncedSearch, currentFilters.search, updateUrl]);

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!currentFilters.dateFrom) return undefined;

    return {
      from: new Date(currentFilters.dateFrom),
      to: currentFilters.dateTo ? new Date(currentFilters.dateTo) : undefined,
    };
  }, [currentFilters.dateFrom, currentFilters.dateTo]);

  const handleDateChange = (range: DateRange | undefined) => {
    updateUrl({
      dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      skip: 0,
    });
  };

  return (
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
        <DatePickerWithRange value={dateRange} onValueChange={handleDateChange} />
      </div>
    </div>
  );
}
