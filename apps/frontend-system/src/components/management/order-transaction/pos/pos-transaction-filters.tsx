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
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useDebounce } from "@/hooks/use-debounce";
import { PosTransactionFilters } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";

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
  return (
    <div className="flex flex-wrap gap-3 py-2 px-3 rounded-md bg-background shadow">
      <InputGroup className="w-80">
        <InputGroupAddon>
          <InputGroupInput
            placeholder="Cari..."
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
        onValueChange={(val) => handleUpdateParams("storeId", val)}
      >
        <SelectTrigger className={"w-70"}>
          <SelectValue placeholder="Pilih Toko" />
        </SelectTrigger>
        <SelectContent>
          {storeList?.data.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={posFilters?.status}
        onValueChange={(val) => handleUpdateParams("status", val)}
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
