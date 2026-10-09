"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackagePlus, Pencil, XCircle } from "lucide-react";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PRODUCTION_STATUS_LABEL } from "@/components/management/production/column";
import { DeliveryDialog } from "@/components/management/production/delivery-dialog";
import { CloseBatchDialog } from "@/components/management/production/close-batch-dialog";
import { useProductionOperation } from "@/hooks/management/production/use-production-operation";
import { useCanManageMaster } from "@/hooks/management/use-central-store";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const canManage = useCanManageMaster();
  const { id } = use(params);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isCloseOpen, setIsCloseOpen] = useState(false);

  const { productionDetail, isLoadingDetail, cancelDeliveryData } =
    useProductionOperation({ productionId: id });

  if (isLoadingDetail || !productionDetail) {
    return (
      <main className="flex flex-1 flex-col gap-4 p-4">
        <p className="text-sm text-muted-foreground">Memuat batch...</p>
      </main>
    );
  }

  const batch = productionDetail;
  const isClosed = batch.status === "COMPLETED" || batch.status === "CANCELLED";
  const percent =
    batch.totalTarget > 0
      ? Math.round((batch.totalDelivered / batch.totalTarget) * 100)
      : 0;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <Link
          href="/management/production"
          className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={16} /> Kembali ke daftar produksi
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-xl font-bold">{batch.code}</h1>
              <Badge variant="outline">
                {PRODUCTION_STATUS_LABEL[batch.status] ?? batch.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Target selesai{" "}
              {dayjs(batch.targetDate).locale("id").format("DD MMMM YYYY")}
              {batch.parentCode && ` · lanjutan dari ${batch.parentCode}`}
            </p>
          </div>

          {/* Batch yang sudah tutup buku tidak menawarkan tombol yang pasti
              ditolak server. */}
          {!isClosed && canManage && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href={`/management/production/${batch.id}/edit`}>
                  <Pencil className="h-4 w-4" /> Ubah Batch
                </Link>
              </Button>
              <Button variant="outline" onClick={() => setIsCloseOpen(true)}>
                <XCircle className="h-4 w-4" /> Tutup Batch
              </Button>
              <Button onClick={() => setIsDeliveryOpen(true)}>
                <PackagePlus className="h-4 w-4" /> Catat Setoran
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Kemajuan Batch</p>
          <p className="text-sm text-muted-foreground">
            {batch.totalDelivered}/{batch.totalTarget} pcs ({percent}%) ·{" "}
            {batch.variantCount} varian
          </p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
        {batch.notes && (
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {batch.notes}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <p className="text-sm font-medium">Varian dalam Batch</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produk</TableHead>
              <TableHead>Varian</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Target</TableHead>
              <TableHead className="text-right">Sudah Masuk</TableHead>
              <TableHead className="text-right">Sisa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.productName}</TableCell>
                <TableCell className="text-muted-foreground">
                  {item.variantLabel || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.sku}
                </TableCell>
                <TableCell className="text-right">
                  {item.targetQuantity}
                </TableCell>
                <TableCell className="text-right">
                  {item.deliveredQuantity}
                </TableCell>
                <TableCell className="text-right">
                  {Math.max(item.targetQuantity - item.deliveredQuantity, 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <p className="text-sm font-medium">Riwayat Setoran</p>
          <p className="text-xs text-muted-foreground">
            Tiap setoran menambah stok rumah produksi saat dicatat.
          </p>
        </div>

        {batch.deliveries.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Belum ada setoran untuk batch ini.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {batch.deliveries.map((delivery) => (
              <div key={delivery.id} className="flex flex-wrap gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {dayjs(delivery.deliveredAt)
                      .locale("id")
                      .format("DD MMMM YYYY")}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      dicatat {delivery.recordedByName ?? "-"}
                    </span>
                  </p>
                  <ul className="mt-1 space-y-0.5">
                    {delivery.items.map((row) => (
                      <li
                        key={`${delivery.id}-${row.productionItemId}`}
                        className="text-sm text-muted-foreground"
                      >
                        {row.productName} ({row.sku}) — {row.quantity} pcs
                      </li>
                    ))}
                  </ul>
                  {delivery.note && (
                    <p className="mt-1.5 rounded bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                      {delivery.note}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  /// Pembatalan setoran menarik stok kembali, jadi hanya
                  /// pengelola pusat yang boleh melakukannya.
                  disabled={!canManage}
                  onClick={() =>
                    cancelDeliveryData({
                      id: batch.id,
                      deliveryId: delivery.id,
                    })
                  }
                >
                  Batalkan
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeliveryDialog
        open={isDeliveryOpen}
        onOpenChange={setIsDeliveryOpen}
        batch={batch}
      />
      <CloseBatchDialog
        open={isCloseOpen}
        onOpenChange={setIsCloseOpen}
        batch={batch}
      />
      <Toaster />
    </main>
  );
}
