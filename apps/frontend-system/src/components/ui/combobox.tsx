"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxItem {
  value: string;
  /// Teks utama yang tampil di tombol setelah dipilih.
  label: string;
  /// Baris kedua di daftar pilihan, mis. SKU dan varian.
  description?: string;
  /// Penanda kecil di ujung baris, mis. "Draft" atau "Nonaktif".
  badge?: string;
  /**
   * Kata kunci tambahan yang ikut dicocokkan saat mengetik.
   *
   * Inilah yang membuat pencarian bisa memakai nama produk MAUPUN SKU:
   * `value` harus tetap id yang unik, jadi kata kunci pencariannya
   * dititipkan terpisah.
   */
  keywords?: string[];
}

interface ComboboxProps {
  items: ComboboxItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}

/**
 * Daftar pilihan yang bisa dicari.
 *
 * Bedanya dengan `CreatableCombobox`: tidak bisa membuat pilihan baru, dan
 * tiap baris punya dua lantai (nama di atas, keterangan di bawah) — bentuk
 * yang dibutuhkan untuk memilih varian produk, di mana SKU dan nama varian
 * sama pentingnya dengan nama produknya.
 */
export function Combobox({
  items,
  value,
  onChange,
  placeholder = "Pilih salah satu",
  searchPlaceholder = "Ketik untuk mencari...",
  emptyMessage = "Tidak ada yang cocok",
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = items.find((item) => item.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="w-full justify-between overflow-hidden font-normal"
        >
          <span className="truncate">
            {selected ? (
              <>
                {selected.label}
                {selected.description && (
                  <span className="text-muted-foreground">
                    {" "}
                    · {selected.description}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Lebar panel diikat ke lebar tombolnya; tanpa ini panel menyempit
          sendiri dan keterangan tiap baris terpotong. */}
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          {/* Dibatasi tingginya: daftar varian bisa ratusan baris. */}
          <CommandList className="max-h-72">
            <CommandEmpty>
              <p className="p-3 text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.value}
                  keywords={item.keywords}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className="items-start gap-2"
                >
                  <Check
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item.label}</span>
                    {item.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.badge && (
                    <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {item.badge}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
