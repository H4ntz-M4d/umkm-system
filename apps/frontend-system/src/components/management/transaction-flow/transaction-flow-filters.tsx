import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { TransactionFlowFilter } from "@/lib/queries/transaction-flow/transaction-flow.query";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ReadonlyURLSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

interface TransactionFlowFilterProps {
  searchParams: ReadonlyURLSearchParams;
  filters: TransactionFlowFilter;
}
export default function TransactionFlowFilterComponents({
  searchParams,
  filters,
}: TransactionFlowFilterProps) {
  const { storeList } = useStoreOperations({ enableStoreList: true });
  const router = useRouter();
  const pathName = usePathname();
  const updateParams = useCallback(
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

  const handleUpdateParams = (
    key: string,
    val: string | number | undefined,
  ) => {
    updateParams({ [key]: val, page: 0 });
  };

  return (
    <div className="flex flex-wrap justify-start items-center gap-2 py-2 px-4 rounded-md bg-primary-foreground shadow">
      <Select
        value={filters.store}
        onValueChange={(val) => handleUpdateParams("store", val)}
      >
        <SelectTrigger className="bg-background w-70">
          <SelectValue placeholder="Pilih Toko" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="none">Semua tipe</SelectItem>
          {storeList?.data?.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filters.type}
        onValueChange={(val) => handleUpdateParams("type", val)}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Pilih tipe" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="IN">Masuk</SelectItem>
          <SelectItem value="OUT">Keluar</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={filters.source}
        onValueChange={(val) => handleUpdateParams("source", val)}
      >
        <SelectTrigger className="bg-background">
          <SelectValue placeholder="Sumber data" />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="POS">Kasir</SelectItem>
          <SelectItem value="ORDER">Pesanan Online</SelectItem>
          <SelectItem value="PRODUCTION">Produksi</SelectItem>
          <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
