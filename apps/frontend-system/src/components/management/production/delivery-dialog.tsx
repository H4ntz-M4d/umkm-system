"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DatePickerSimple } from "@/components/ui/date-picker-simple";
import { ProductionDetailDataType } from "@repo/schemas";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";

interface DeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductionDetailDataType;
}

/**
 * Mencatat satu kali antar hasil produksi.
 *
 * Seluruh varian batch ditampilkan, bukan hanya yang diantar: admin tinggal
 * mengisi yang datang hari itu dan membiarkan sisanya kosong.
 */
export function DeliveryDialog({
  open,
  onOpenChange,
  batch,
}: DeliveryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {/* Isinya baru dipasang saat dialog dibuka, jadi isian selalu mulai
            bersih tanpa perlu di-reset lewat useEffect. */}
        {open && (
          <DeliveryForm batch={batch} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeliveryForm({
  batch,
  onDone,
}: {
  batch: ProductionDetailDataType;
  onDone: () => void;
}) {
  const [deliveredAt, setDeliveredAt] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const { recordDeliveryData, isRecordingDelivery } = useProductionOperation(
    {},
  );

  const remainingOf = (item: ProductionDetailDataType["items"][number]) =>
    Math.max(item.targetQuantity - item.deliveredQuantity, 0);

  const numberOf = (id: string) =>
    Number(quantities[id]?.replace(/[^\d]/g, "") || 0);
  const totalMasuk = batch.items.reduce(
    (total, item) => total + numberOf(item.id),
    0,
  );

  const handleSave = async () => {
    setError(null);

    const melebihi = batch.items.filter(
      (item) => numberOf(item.id) > remainingOf(item),
    );

    if (melebihi.length > 0) {
      setError(
        `Jumlah melebihi sisa target: ${melebihi
          .map((item) => `${item.productName} (sisa ${remainingOf(item)})`)
          .join(", ")}`,
      );
      return;
    }

    if (totalMasuk === 0) {
      setError("Isi jumlah minimal satu varian.");
      return;
    }

    try {
      await recordDeliveryData({
        id: batch.id,
        data: {
          deliveredAt,
          note: note.trim() || undefined,
          items: batch.items.map((item) => ({
            productionItemId: item.id,
            quantity: numberOf(item.id),
          })),
        },
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencatat setoran");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Catat Setoran</DialogTitle>
        <DialogDescription>
          Barang yang diantar toko produksi untuk batch {batch.code}. Stok rumah
          produksi langsung bertambah begitu disimpan.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <Field>
          <FieldLabel>Tanggal Masuk</FieldLabel>
          <DatePickerSimple
            value={deliveredAt}
            onValueChange={(value) => value && setDeliveredAt(value)}
          />
        </Field>

        <Field>
          <FieldLabel>Catatan dari Toko Produksi (opsional)</FieldLabel>
          <Textarea
            className="h-16"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Misalnya: hasil QC lolos semua, 2 pcs diulang minggu depan..."
          />
        </Field>

        <div>
          <p className="mb-2 text-sm font-medium">
            Jumlah yang Masuk{" "}
            <span className="text-xs font-normal text-muted-foreground">
              — kosongkan yang tidak ikut diantar
            </span>
          </p>

          <ScrollArea className="max-h-64 pr-2">
            <div className="space-y-2">
              {batch.items.map((item) => {
                const sisa = remainingOf(item);

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{item.productName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[item.variantLabel, item.sku]
                          .filter(Boolean)
                          .join(" · ")}{" "}
                        — sisa {sisa} pcs
                      </p>
                    </div>
                    <Input
                      inputMode="numeric"
                      className="w-24"
                      placeholder="0"
                      value={quantities[item.id] ?? ""}
                      /// Baris yang targetnya sudah terpenuhi tidak bisa
                      /// diisi: servernya pun menolak.
                      disabled={sisa === 0}
                      onChange={(event) =>
                        setQuantities((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <p className="mt-2 text-sm text-muted-foreground">
            Total yang dicatat: {totalMasuk} pcs
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isRecordingDelivery || totalMasuk === 0}
        >
          {isRecordingDelivery ? "Menyimpan..." : "Simpan Setoran"}
        </Button>
      </DialogFooter>
    </>
  );
}
