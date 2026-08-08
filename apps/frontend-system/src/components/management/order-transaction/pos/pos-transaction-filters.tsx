import posFilters from "@/components/pos/pos-filters";
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
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useDebounce } from "@/hooks/use-debounce";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface PosTransactionFiltersComponentProps {
  handleUpdateParams: (key: string, val: string | number | undefined) => void;
  posFilters?: PosTransactionFilters;
}
export default function PosTransactionFiltersComponent({
  handleUpdateParams,
  posFilters,
}: PosTransactionFiltersComponentProps) {
  const { storeList } = useStoreOperations({ enableStoreList: true });
  const [search, setSearch] = useState(posFilters?.search ?? "");
  const debouncedSearch = useDebounce(search, 500);
  const currentSearch = posFilters?.search;

  useEffect(() => {
    if (currentSearch !== debouncedSearch) {
      handleUpdateParams("search", debouncedSearch);
    }
  }, [debouncedSearch, handleUpdateParams, currentSearch]);

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!posFilters?.dateFrom) return undefined;

    return {
      from: new Date(posFilters.dateFrom),
      to: posFilters.dateTo ? new Date(posFilters.dateTo) : undefined,
    };
  }, [posFilters?.dateFrom, posFilters?.dateTo]);

  const handleDateChange = (range: DateRange | undefined) => {
    handleUpdateParams(
      "posTransactioDate",
      range?.from
        ? `${format(range.from, "yyyy-MM-dd")},${range.to ? format(range.to, "yyyy-MM-dd") : ""}`
        : undefined,
    );
  };

  return (
    <div className="flex flex-wrap gap-3 py-2 px-3 rounded-md bg-background shadow">
      <InputGroup className="w-80">
        <InputGroupAddon className="w-full">
          <InputGroupInput
            placeholder="Cari order id atau nama kasir..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroupAddon>
      </InputGroup>
      <Select
        value={posFilters?.storeId}
        onValueChange={(val) => handleUpdateParams("posTransactioStore", val)}
      >
        <SelectTrigger className={"w-70"}>
          <SelectValue placeholder="Pilih Toko" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Semua</SelectItem>
          {storeList?.data.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DatePickerWithRange value={dateRange} onValueChange={handleDateChange} />
      <Select
        value={posFilters?.status}
        onValueChange={(val) => handleUpdateParams("posTransactioStatus", val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Semua</SelectItem>
          <SelectItem value="PENDING">Menunggu</SelectItem>
          <SelectItem value="PARKED">Antrian</SelectItem>
          <SelectItem value="PAID">Dibayar</SelectItem>
          <SelectItem value="CANCELLED">Batal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
