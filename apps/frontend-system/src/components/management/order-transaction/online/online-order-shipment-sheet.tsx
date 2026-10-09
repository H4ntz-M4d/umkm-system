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
  AdminOrderShipmentData,
  ShipmentUpdateStatus,
  z,
  type ShipmentUpdateStatusInput,
} from "@repo/schemas";
import { toIDR } from "../../../../../utils/format-money";

/// Bentuk admin: memuat catatan paket yang tidak pernah dikirim ke customer.
type OrderShipment = z.infer<typeof AdminOrderShipmentData>;

/// Ditulis satu-satu, bukan diturunkan dari enum, supaya labelnya berbahasa
/// Indonesia dan urutannya mengikuti alur pengiriman yang sebenarnya.
///
/// `blockedReason` cerminan aturan di `updateShipment` (order.service.ts):
/// pilihan yang pasti ditolak server tidak ditawarkan, dan alasannya
/// ditulis di pilihannya sendiri.
const STATUS_OPTIONS: {
  value: ShipmentUpdateStatusInput;
  label: string;
  blockedReason: (orderStatus: string) => string | null;
}[] = [
  {
    value: "PACKAGING",
    label: "Sedang Dikemas",
    blockedReason: (orderStatus) =>
      orderStatus === "SHIPPED" ? "sudah dikirim" : null,
  },
  {
    value: "SHIPPED",
    label: "Dikirim",
    blockedReason: (orderStatus) =>
      orderStatus === "PAID" || orderStatus === "SHIPPED"
        ? null
        : "pesanan belum Lunas",
  },
  {
    value: "DELIVERED",
    label: "Diterima",
    blockedReason: (orderStatus) =>
      orderStatus === "SHIPPED" ? null : "tandai Dikirim dulu",
  },
];

/// Perubahan status pengiriman ikut menggeser status pesanan. Ditampilkan ke
/// admin supaya efeknya tidak mengejutkan.
const ORDER_EFFECT: Partial<Record<ShipmentUpdateStatusInput, string>> = {
  SHIPPED: "Status pesanan ikut menjadi Dikirim",
  DELIVERED:
    "Pesanan jadi Selesai dan stok yang dikunci resmi keluar — tidak bisa diubah lagi",
};

const FINAL_ORDER_STATUSES = ["COMPLETED", "CANCELLED", "REFUNDED"];

interface OrderShipmentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: OrderShipment | null;
  orderId: string | null;
  /// Status pesanannya — menentukan pilihan pengiriman yang sah.
  orderStatus: string | null;
  onSave: (data: {
    status: ShipmentUpdateStatusInput;
    trackingNumber: string | null;
    shippingCost: number;
    /// Catatan paket: teks kosong disimpan sebagai null supaya "tidak diisi"
    /// dan "diisi kosong" tidak jadi dua keadaan berbeda.
    totalWeight: string | null;
    unitWeight: string | null;
    unitPrice: number | null;
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
  orderStatus,
  onSave,
  isSaving = false,
}: OrderShipmentSheetProps) {
  const [status, setStatus] = useState<ShipmentUpdateStatusInput>("PACKAGING");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [totalWeight, setTotalWeight] = useState("");
  const [unitWeight, setUnitWeight] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  // Form diisi ulang setiap sheet dibuka, supaya tidak membawa sisa pesanan
  // yang dilihat sebelumnya.
  useEffect(() => {
    if (!open || !shipment) return;

    // Data lama berstatus Dibatalkan tidak punya padanan pilihan; jatuh ke
    // Dikemas sebagai titik awal.
    const parsed = ShipmentUpdateStatus.safeParse(shipment.status);
    setStatus(parsed.success ? parsed.data : "PACKAGING");
    setTrackingNumber(shipment.trackingNumber ?? "");
    setShippingCost(String(Math.trunc(Number(shipment.shippingCost))));
    setTotalWeight(shipment.totalWeight ?? "");
    setUnitWeight(shipment.unitWeight ?? "");
    setUnitPrice(
      shipment.unitPrice ? String(Math.trunc(Number(shipment.unitPrice))) : "",
    );
  }, [open, shipment]);

  /// Angka diketik apa adanya lalu dibersihkan, supaya admin boleh mengetik
  /// "25.000" maupun "25000" — sama seperti dialog nego.
  const nextShippingCost = Number(shippingCost.replace(/[^\d]/g, ""));
  /// Kosong berarti "tidak diisi", bukan nol — 0 adalah harga yang sah.
  const nextUnitPrice =
    unitPrice.trim() === "" ? null : Number(unitPrice.replace(/[^\d]/g, ""));

  /// Dinormalkan ke string kosong supaya catatan yang memang kosong dan tetap
  /// kosong tidak terhitung sebagai perubahan.
  const savedUnitPrice = shipment?.unitPrice
    ? String(Math.trunc(Number(shipment.unitPrice)))
    : "";

  const isDirty =
    shipment !== null &&
    (status !== (shipment.status ?? "PACKAGING") ||
      trackingNumber.trim() !== (shipment.trackingNumber ?? "") ||
      nextShippingCost !== Math.trunc(Number(shipment.shippingCost)) ||
      totalWeight.trim() !== (shipment.totalWeight ?? "") ||
      unitWeight.trim() !== (shipment.unitWeight ?? "") ||
      unitPrice.trim() !== savedUnitPrice);

  /// Pesanan yang sudah tutup buku: pengirimannya hanya bisa dilihat.
  const isLocked = FINAL_ORDER_STATUSES.includes(orderStatus ?? "");

  const handleSave = async () => {
    try {
      await onSave({
        status,
        trackingNumber: trackingNumber.trim() || null,
        shippingCost: nextShippingCost,
        totalWeight: totalWeight.trim() || null,
        unitWeight: unitWeight.trim() || null,
        unitPrice: nextUnitPrice,
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

              <Field>
                <FieldLabel>Status Pengiriman</FieldLabel>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as ShipmentUpdateStatusInput)
                  }
                  disabled={isLocked}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => {
                      // Status yang sedang berlaku tetap bisa dipilih, supaya
                      // admin bisa mengganti resi tanpa menggeser status.
                      const reason =
                        option.value === shipment.status
                          ? null
                          : option.blockedReason(orderStatus ?? "");
                      return (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          disabled={reason !== null}
                        >
                          {option.label}
                          {reason && (
                            <span className="text-xs text-muted-foreground">
                              ({reason})
                            </span>
                          )}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {isLocked && (
                  <p className="text-xs text-muted-foreground">
                    Pesanan ini sudah selesai atau dibatalkan, data
                    pengirimannya tidak bisa diubah lagi.
                  </p>
                )}
                {!isLocked &&
                  status !== shipment.status &&
                  ORDER_EFFECT[status] && (
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit font-normal"
                    >
                      {ORDER_EFFECT[status]}
                    </Badge>
                  )}
              </Field>

              <Field>
                <FieldLabel>Biaya Pengiriman</FieldLabel>
                <Input
                  inputMode="numeric"
                  value={shippingCost}
                  onChange={(event) => setShippingCost(event.target.value)}
                  placeholder="Contoh: 25000"
                  disabled={isLocked}
                />
                {/* Dikatakan terus terang: admin perlu tahu angka ini tidak
                    menambah tagihan customer, supaya tidak menyangka
                    customer otomatis ditagih ongkir. */}
                <p className="text-xs text-muted-foreground">
                  Ongkir yang dibayarkan ke kurir. Dicatat sebagai keterangan
                  saja — tidak menambah tagihan customer.
                  {nextShippingCost > 0 &&
                    ` Tercatat ${toIDR(nextShippingCost)}.`}
                </p>
              </Field>

              <Field>
                <FieldLabel>Nomor Resi</FieldLabel>
                <Input
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="Contoh: JP1234567890"
                  disabled={isLocked}
                />
              </Field>

              {/* Catatan paket. Dikelompokkan supaya jelas ketiganya sekadar
                  keterangan, bukan angka yang ikut dihitung sistem. */}
              <div className="rounded-xl border border-border p-3 space-y-4">
                <div>
                  <p className="text-sm font-medium">Catatan Paket</p>
                  <p className="text-xs text-muted-foreground">
                    Keterangan untuk admin. Tidak menambah tagihan customer,
                    tidak dicatat di kas, dan tidak terlihat oleh customer.
                  </p>
                </div>

                <Field>
                  <FieldLabel>Berat Total</FieldLabel>
                  <Input
                    value={totalWeight}
                    onChange={(event) => setTotalWeight(event.target.value)}
                    placeholder="Contoh: 15 Kg"
                    disabled={isLocked}
                    maxLength={50}
                  />
                </Field>

                <Field>
                  <FieldLabel>Berat per Satuan</FieldLabel>
                  <Input
                    value={unitWeight}
                    onChange={(event) => setUnitWeight(event.target.value)}
                    placeholder="Contoh: 1,5 Kg/pcs"
                    disabled={isLocked}
                    maxLength={50}
                  />
                </Field>

                <Field>
                  <FieldLabel>Harga per Satuan</FieldLabel>
                  <Input
                    inputMode="numeric"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    placeholder="Contoh: 12000"
                    disabled={isLocked}
                  />
                  {nextUnitPrice !== null && nextUnitPrice > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Tercatat {toIDR(nextUnitPrice)} per satuan.
                    </p>
                  )}
                </Field>
              </div>
            </div>

            <SheetFooter>
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !isDirty || isLocked}
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
