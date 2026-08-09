"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  OrderShipmentData,
  ShipmentStatus,
  z,
  type ShipmentStatusInput,
} from "@repo/schemas";
import { toIDR } from "../../../../../utils/format-money";

type OrderShipment = z.infer<typeof OrderShipmentData>;

/// Ditulis satu-satu, bukan diturunkan dari enum, supaya labelnya berbahasa
/// Indonesia dan urutannya mengikuti alur pengiriman yang sebenarnya.
const STATUS_OPTIONS: { value: ShipmentStatusInput; label: string }[] = [
  { value: "PACKAGING", label: "Sedang Dikemas" },
  { value: "SHIPPED", label: "Dikirim" },
  { value: "DELIVERED", label: "Diterima" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

/// Perubahan status pengiriman ikut menggeser status pesanan. Ditampilkan ke
/// admin supaya efeknya tidak mengejutkan.
const ORDER_EFFECT: Partial<Record<ShipmentStatusInput, string>> = {
  SHIPPED: "Status pesanan ikut berubah menjadi SHIPPED",
  DELIVERED: "Status pesanan ikut berubah menjadi COMPLETED",
};

interface OrderShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: OrderShipment | null;
  orderId: string | null;
  onSave: (data: {
    status: ShipmentStatusInput;
    trackingNumber: string | null;
  }) => Promise<unknown>;
  isSaving?: boolean;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b pb-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

export function OrderShipmentSheet({
  open,
  onOpenChange,
  shipment,
  orderId,
  onSave,
  isSaving = false,
}: OrderShipmentSheetProps) {
  const [status, setStatus] = useState<ShipmentStatusInput>("PACKAGING");
  const [trackingNumber, setTrackingNumber] = useState("");

  // Form diisi ulang setiap sheet dibuka, supaya tidak membawa sisa pesanan
  // yang dilihat sebelumnya.
  useEffect(() => {
    if (!open || !shipment) return;

    const parsed = ShipmentStatus.safeParse(shipment.status);
    setStatus(parsed.success ? parsed.data : "PACKAGING");
    setTrackingNumber(shipment.trackingNumber ?? "");
  }, [open, shipment]);

  const isDirty =
    shipment !== null &&
    (status !== (shipment.status ?? "PACKAGING") ||
      trackingNumber.trim() !== (shipment.trackingNumber ?? ""));

  const handleSave = async () => {
    try {
      await onSave({
        status,
        trackingNumber: trackingNumber.trim() || null,
      });
      // Sheet hanya ditutup kalau simpannya berhasil.
      onOpenChange(false);
    } catch {
      // Pesan galatnya sudah ditampilkan lewat toast oleh mutation. Di sini
      // rejection cukup ditelan supaya tidak jadi unhandled promise rejection,
      // dan sheet sengaja dibiarkan terbuka agar admin bisa membetulkan
      // pilihannya tanpa membuka ulang pesanan.
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Detail Pengiriman</SheetTitle>
          <SheetDescription>
            {orderId
              ? `Pesanan ${orderId} — perbarui status dan nomor resi.`
              : "Informasi penerima dan pengiriman untuk pesanan ini."}
          </SheetDescription>
        </SheetHeader>

        {shipment ? (
          <>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
              <DetailRow label="Nama Penerima" value={shipment.recipientName} />
              <DetailRow label="Telepon" value={shipment.phone} />
              <DetailRow label="Alamat" value={shipment.addressLine} />
              <DetailRow label="Kota" value={shipment.city} />
              <DetailRow label="Provinsi" value={shipment.province} />
              <DetailRow label="Kurir" value={shipment.courier} />
              <DetailRow
                label="Biaya Pengiriman"
                value={toIDR(shipment.shippingCost)}
              />

              <Field>
                <FieldLabel>Status Pengiriman</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as ShipmentStatusInput)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ORDER_EFFECT[status] && (
                  <Badge variant="secondary" className="mt-1 w-fit font-normal">
                    {ORDER_EFFECT[status]}
                  </Badge>
                )}
              </Field>

              <Field>
                <FieldLabel>Nomor Resi</FieldLabel>
                <Input
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Contoh: JP1234567890"
                />
              </Field>
            </div>

            <SheetFooter>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty}
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Batal
              </Button>
            </SheetFooter>
          </>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">
            Pesanan ini tidak memiliki data pengiriman.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
