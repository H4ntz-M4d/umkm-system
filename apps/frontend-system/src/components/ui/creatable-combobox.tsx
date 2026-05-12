"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

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

export type ComboboxOption = {
  label: string;
  value: string;
};

type CreatableComboboxProps = {
  options?: ComboboxOption[];

  value?: string;

  onChange?: (value: string) => void;

  onCreate?: (input: string) => Promise<ComboboxOption>;

  placeholder?: string;

  searchPlaceholder?: string;

  emptyMessage?: string;

  name?: string;

  disabled?: boolean;
};

export function CreatableCombobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyMessage = "No data found",
  disabled,
}: CreatableComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const [input, setInput] = React.useState("");

  const [loading, setLoading] = React.useState(false);

  const selectedOption = options?.find((option) => option.value === value);

  const itemExists = options?.some(
    (option) => option.label.toLowerCase() === input.toLowerCase(),
  );

  async function handleCreate() {
    if (!onCreate || !input) return;

    try {
      setLoading(true);

      const created = await onCreate(input);

      onChange?.(created.value);

      setInput("");

      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className="w-full justify-between overflow-hidden"
        >
          <span className="truncate">{selectedOption?.label ?? placeholder}</span>

          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full">
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            value={input}
            onValueChange={setInput}
          />

          <CommandList>
            <CommandEmpty>
              <div className="flex flex-col gap-2 p-2">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>

                {!!input && !itemExists && !!onCreate && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreate}
                    disabled={loading}
                  >
                    <Plus className="mr-2 size-4" />
                    Create {input}
                  </Button>
                )}
              </div>
            </CommandEmpty>

            <CommandGroup>
              {options?.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onChange?.(option.value);

                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />

                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
