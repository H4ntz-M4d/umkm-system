"use client";

import { Plus } from "lucide-react";
import { toIDR } from "../../../utils/format-money";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface DialogProductCardProps {
  product: any;
  open?: boolean;
  setIdPm: (idPm: string | null) => void;
}

export default function DialogProductCard({
  product,
  open,
  setIdPm,
}: DialogProductCardProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setIdPm(null);
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
              return (
                <Card key={variant.id}>
                  <CardContent className="flex flex-col gap-2">
                    <h4 className="text-base">{varOpt}</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        Stok: {variant.stock ?? 0}
                      </p>
                      <p>{toIDR(variant.price)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        <div className="flex flex-row items-center justify-end gap-3 my-2">
          <Button variant={"outline"}>Batal</Button>
          <Button>
            <Plus />
            Tambah ke Pesanan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
