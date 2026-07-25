"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OrderShipmentData, z } from "@repo/schemas";
import { toIDR } from "../../../../../utils/format-money";

type OrderShipment = z.infer<typeof OrderShipmentData>;

interface OrderShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: OrderShipment | null;
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
}: OrderShipmentSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Detail Pengiriman</SheetTitle>
          <SheetDescription>
            Informasi penerima dan pengiriman untuk pesanan ini.
          </SheetDescription>
        </SheetHeader>
        {shipment ? (
          <div className="flex flex-col gap-4 px-4">
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
          </div>
        ) : (
          <p className="px-4 text-sm text-muted-foreground">
            Pesanan ini tidak memiliki data pengiriman.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
}
