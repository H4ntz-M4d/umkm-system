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
import { OrderFilters } from "@/lib/queries/order/order.query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface OrderListFiltersProps {
  handleUpdateParams: (key: string, val: string | number | undefined) => void;
  filters?: OrderFilters;
}

export default function OrderListFilters({
  handleUpdateParams,
  filters,
}: OrderListFiltersProps) {
  const { storeList } = useStoreOperations({ enableStoreList: true });
  const [search, setSearch] = useState(filters?.search ?? "");
  const debouncedSearch = useDebounce(search, 500);
  const currentSearch = filters?.search;

  useEffect(() => {
    if (currentSearch !== debouncedSearch) {
      handleUpdateParams("orderSearch", debouncedSearch);
    }
  }, [debouncedSearch, handleUpdateParams, currentSearch]);

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!filters?.dateFrom) return undefined;

    return {
      from: new Date(filters.dateFrom),
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };
  }, [filters?.dateFrom, filters?.dateTo]);

  const handleDateChange = (range: DateRange | undefined) => {
    handleUpdateParams(
      "orderDate",
      range?.from
        ? `${format(range.from, "yyyy-MM-dd")},${range.to ? format(range.to, "yyyy-MM-dd") : ""}`
        : undefined,
    );
  };

  return (
    <div className="flex flex-wrap gap-3 py-2 px-3 rounded-md bg-background shadow">
      <InputGroup className="w-80 flex">
        <InputGroupAddon className="w-full">
          <InputGroupInput
            placeholder="Cari order id atau nama pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroupAddon>
      </InputGroup>
      <Select
        value={filters?.store}
        onValueChange={(val) => handleUpdateParams("orderStore", val)}
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
        value={filters?.status}
        onValueChange={(val) => handleUpdateParams("orderStatus", val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Semua</SelectItem>
          <SelectItem value="PENDING">Menunggu</SelectItem>
          <SelectItem value="PAID">Dibayar</SelectItem>
          <SelectItem value="CANCELLED">Batal</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
