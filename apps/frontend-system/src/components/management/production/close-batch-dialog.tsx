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
import { Checkbox } from "@/components/ui/checkbox";
import { ProductionDetailDataType } from "@repo/schemas";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";

interface CloseBatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductionDetailDataType;
}

export function CloseBatchDialog({
  open,
  onOpenChange,
  batch,
}: CloseBatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* Dipasang ulang tiap dibuka, jadi centangnya selalu kembali ke
            bawaannya tanpa useEffect. */}
        {open && <CloseForm batch={batch} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function CloseForm({
  batch,
  onDone,
}: {
  batch: ProductionDetailDataType;
  onDone: () => void;
}) {
  const [createContinuation, setCreateContinuation] = useState(true);
  const { closeProductionData, isClosing } = useProductionOperation({});

  const sisa = Math.max(batch.totalTarget - batch.totalDelivered, 0);
  const belumAdaSetoran = batch.totalDelivered === 0;

  const handleClose = async () => {
    try {
      await closeProductionData({ id: batch.id, createContinuation });
      onDone();
    } catch {
      // Toast galatnya sudah ditampilkan mutation.
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tutup Batch {batch.code}</DialogTitle>
        <DialogDescription>
          {belumAdaSetoran
            ? "Belum ada satu pun barang yang masuk, jadi batch ini akan ditandai Dibatalkan — bukan Selesai."
            : `Batch ditandai selesai dengan ${batch.totalDelivered} dari ${batch.totalTarget} pcs.`}
        </DialogDescription>
      </DialogHeader>

      {sisa > 0 && !belumAdaSetoran && (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox
            checked={createContinuation}
            onCheckedChange={(checked) =>
              setCreateContinuation(checked === true)
            }
            className="mt-0.5"
          />
          <span>
            Buat batch lanjutan untuk sisa {sisa} pcs
            <span className="block text-xs text-muted-foreground">
              Batch baru dibuat berisi kekurangan tiap varian, dan tercatat
              sebagai lanjutan batch ini.
            </span>
          </span>
        </label>
      )}

      <p className="text-xs font-medium text-destructive">
        Batch yang sudah ditutup tidak bisa disetori atau diubah lagi.
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Batal
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleClose}
          disabled={isClosing}
        >
          {isClosing ? "Menutup..." : "Tutup Batch"}
        </Button>
      </DialogFooter>
    </>
  );
}
