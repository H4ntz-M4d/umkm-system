"use client";

import { DatePickerWithRange } from "@/components/ui/date-picker-range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { ReportFilters } from "@/lib/queries/reports/reports.query";
import { format } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { DateRange } from "react-day-picker";

/**
 * Preset ada karena memilih tanggal manual itu friksi: sebagian besar
 * pertanyaan yang dibawa pemilik toko berbentuk "bulan ini" atau "tahun ini",
 * bukan rentang sembarang.
 */
const PRESETS = [
  { value: "this-month", label: "Bulan ini" },
  { value: "last-month", label: "Bulan lalu" },
  { value: "last-3-months", label: "3 bulan terakhir" },
  { value: "this-year", label: "Tahun ini" },
] as const;

type PresetValue = (typeof PRESETS)[number]["value"];

function resolvePreset(preset: PresetValue): { from: Date; to: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case "last-month":
      return {
        from: new Date(year, month - 1, 1),
        to: new Date(year, month, 0),
      };
    case "last-3-months":
      return { from: new Date(year, month - 2, 1), to: now };
    case "this-year":
      return { from: new Date(year, 0, 1), to: now };
    default:
      return { from: new Date(year, month, 1), to: now };
  }
}

interface ReportsFilterProps {
  filters: ReportFilters;
}

export default function ReportsFilter({ filters }: ReportsFilterProps) {
  const { storeList } = useStoreOperations({ enableStoreList: true });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathName = usePathname();

  /**
   * Filter disimpan di URL, bukan state lokal, karena hasil cetak harus persis
   * sama dengan yang di layar dan tautannya harus bisa dibagikan.
   */
  const updateUrl = useCallback(
    (newParams: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      router.push(`${pathName}?${params.toString()}`, { scroll: false });
    },
    [pathName, router, searchParams],
  );

  const dateRange: DateRange | undefined = useMemo(() => {
    if (!filters.dateFrom) return undefined;

    return {
      from: new Date(filters.dateFrom),
      to: filters.dateTo ? new Date(filters.dateTo) : undefined,
    };
  }, [filters.dateFrom, filters.dateTo]);

  const applyPreset = (preset: PresetValue) => {
    const { from, to } = resolvePreset(preset);
    updateUrl({
      preset,
      dateFrom: format(from, "yyyy-MM-dd"),
      dateTo: format(to, "yyyy-MM-dd"),
    });
  };

  const handleDateChange = (range: DateRange | undefined) => {
    updateUrl({
      /// Begitu tanggal dipilih sendiri, preset tidak lagi menggambarkan
      /// rentangnya — jadi dilepas supaya tidak menyesatkan.
      preset: undefined,
      dateFrom: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
      dateTo: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
    });
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-3 rounded-md border border-border bg-primary-foreground px-4 py-3 shadow print:hidden">
      <Select
        value={searchParams.get("preset") ?? ""}
        onValueChange={(value) => applyPreset(value as PresetValue)}
      >
        <SelectTrigger className="w-44 bg-background">
          <SelectValue placeholder="Pilih periode" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DatePickerWithRange value={dateRange} onValueChange={handleDateChange} />

      <Select
        value={filters.storeId ?? ""}
        onValueChange={(value) =>
          updateUrl({ storeId: value === "none" ? undefined : value })
        }
      >
        <SelectTrigger className="w-52 bg-background">
          <SelectValue placeholder="Semua toko" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Semua toko</SelectItem>
          {storeList?.data.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
