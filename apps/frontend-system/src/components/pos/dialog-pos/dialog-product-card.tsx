"use client";

import { Plus } from "lucide-react";
import { toIDR } from "../../../../utils/format-money";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ProductList } from "@/app/point-of-sale/system/page";

interface DialogProductCardProps {
  product: any;
  open?: boolean;
  pickerVariantId?: string | null;
  setPickerProduct: (id: ProductList | null) => void;
  setPickerVariantId: (id: string | null) => void;
  confirmPickVariant: () => void;
}

export default function DialogProductCard({
  product,
  open,
  pickerVariantId,
  setPickerProduct,
  setPickerVariantId,
  confirmPickVariant,
}: DialogProductCardProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setPickerProduct(null);
          setPickerVariantId(null);
        }
      }}
    >
      <DialogContent className="min-w-1/3 bg-sidebar">
        <div className="px-3 flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {product?.name}
            </DialogTitle>
            <DialogDescription>
              Pilih variasi dari beberapa pilihan varian sebelum menambahkan ke
              pesanan
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            {product?.variants.map((variant) => {
              const varOpt = variant.options
                .map((opt) => opt.variantValue.value)
                .join(" - ");
              const active = pickerVariantId === variant.id;
              const oos = variant?.stock === 0;
              return (
                <button
                  key={variant.id}
                  onClick={() => setPickerVariantId(variant.id)}
                  disabled={oos}
                  className={cn(
                    "flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border bg-background hover:border-primary/40",
                    oos && "opacity-50 cursor-not-allowed",
                  )}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-sm font-medium truncate">
                      {varOpt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full text-[11px]">
                    <span className="text-muted-foreground">
                      Stok: {variant.stock ?? 0}
                    </span>
                    <span className="font-semibold text-primary">
                      {toIDR(variant.price)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-3 my-2">
          <DialogClose asChild>
            <Button variant={"outline"} type="button">
              Batal
            </Button>
          </DialogClose>
          <Button type="button" onClick={confirmPickVariant}>
            <Plus />
            Tambah ke Pesanan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
