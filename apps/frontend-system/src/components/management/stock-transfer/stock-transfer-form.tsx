"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStoreOperations } from "@/hooks/management/stores/use-store-operations";
import { useProductsOperation } from "@/hooks/management/products/use-products-operation";
import { CreateStockTransferInput } from "@repo/schemas";

type DraftItem = { productVariantId: string; quantity: number };

const EMPTY_ITEM: DraftItem = { productVariantId: "", quantity: 1 };

export default function StockTransferForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: CreateStockTransferInput) => void;
  isSubmitting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [toStoreId, setToStoreId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([EMPTY_ITEM]);

  const { storeList } = useStoreOperations({ enableStoreList: true });
  const { fetchProductVariantList } = useProductsOperation({
    enabledProductVariantList: true,
  });

  /// Rumah produksi adalah asal kiriman, jadi tidak masuk akal jadi tujuan.
  const destinations = (storeList?.data ?? []).filter(
    (store) => !store.isProductionHouse,
  );

  const variants = (fetchProductVariantList?.data ?? []).flatMap((product) =>
    product.variants.map((variant) => ({
      id: variant.id,
      label: `${product.name} — ${variant.sku}`,
    })),
  );

  const updateItem = (index: number, patch: Partial<DraftItem>) =>
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );

  const reset = () => {
    setToStoreId("");
    setNotes("");
    setItems([EMPTY_ITEM]);
  };

  const filledItems = items.filter(
    (item) => item.productVariantId && item.quantity > 0,
  );
  const canSubmit = toStoreId !== "" && filledItems.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    onSubmit({
      toStoreId,
      notes: notes.trim() || null,
      items: filledItems,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Buat kiriman
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim stok ke toko</DialogTitle>
          <DialogDescription>
            Barang berangkat dari rumah produksi. Stok baru berpindah ke toko
            tujuan setelah penerimaannya dikonfirmasi di sana.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Toko tujuan</Label>
            <Select value={toStoreId} onValueChange={setToStoreId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih toko tujuan" />
              </SelectTrigger>
              <SelectContent>
                {destinations.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    Belum ada toko selain rumah produksi.
                  </div>
                ) : (
                  destinations.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Isi kiriman</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={item.productVariantId}
                  onValueChange={(value) =>
                    updateItem(index, { productVariantId: value })
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih produk" />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        {variant.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={1}
                  className="w-24"
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, { quantity: Number(event.target.value) })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  /// Baris terakhir tidak bisa dihapus: kiriman kosong tidak ada artinya.
                  disabled={items.length === 1}
                  onClick={() =>
                    setItems((current) => current.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setItems((current) => [...current, EMPTY_ITEM])}
            >
              <Plus className="size-4" />
              Tambah produk
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Catatan</Label>
            <Input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Misal: kiriman ekspor untuk distributor, atau nomor resi"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Buat kiriman"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
