"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StockTransferDataType, TransferStatusType } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Send, Truck, X } from "lucide-react";

const STATUS_LABEL: Record<TransferStatusType, string> = {
  READY: "Siap kirim",
  SENT: "Dalam perjalanan",
  RECEIVED: "Diterima",
  CANCELLED: "Dibatalkan",
};

function StatusBadge({ status }: { status: TransferStatusType }) {
  if (status === "SENT") {
    /// Ditonjolkan karena inilah keadaan yang menuntut tindakan: barang sedang
    /// di jalan dan belum masuk stok siapa pun.
    return (
      <Badge className="gap-1">
        <Truck className="size-3.5" />
        {STATUS_LABEL.SENT}
      </Badge>
    );
  }

  if (status === "RECEIVED") {
    return (
      <Badge variant="outline" className="border-secondary text-secondary">
        {STATUS_LABEL.RECEIVED}
      </Badge>
    );
  }

  if (status === "CANCELLED") {
    return <Badge variant="outline">{STATUS_LABEL.CANCELLED}</Badge>;
  }

  return (
    <Badge variant="outline" className="border-primary text-primary">
      {STATUS_LABEL.READY}
    </Badge>
  );
}

export const columnsStockTransfer = (
  onSend: (id: string) => void,
  onReceive: (id: string) => void,
  onCancel: (id: string) => void,
  isMoving: boolean,
): ColumnDef<StockTransferDataType>[] => [
  {
    accessorKey: "code",
    header: "Kode",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.code}</span>
    ),
  },
  {
    accessorKey: "toStoreName",
    header: "Tujuan",
  },
  {
    accessorKey: "items",
    header: () => <p className="text-start">Isi kiriman</p>,
    cell: ({ row }) => (
      <div className="text-start">
        {row.original.items.map((item) => (
          <p key={item.productVariantId} className="text-sm">
            {item.productName}
            {item.variantLabel && (
              <span className="text-muted-foreground">
                {" "}
                · {item.variantLabel}
              </span>
            )}
            <span className="text-muted-foreground"> × {item.quantity}</span>
          </p>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Total unit",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
  {
    accessorKey: "createdAt",
    header: "Dibuat",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {dayjs(row.original.createdAt).locale("id").format("DD MMM YYYY")}
      </span>
    ),
  },
  {
    id: "action",
    header: "Aksi",
    cell: ({ row }) => {
      const { id, status } = row.original;

      /// Tombol mengikuti status, bukan ditampilkan semua lalu dinonaktifkan —
      /// yang tidak berlaku tidak perlu terlihat sama sekali.
      if (status === "READY") {
        return (
          <div className="flex justify-center gap-2">
            <Button size="sm" disabled={isMoving} onClick={() => onSend(id)}>
              <Send className="size-4" />
              Kirim
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isMoving}
              onClick={() => onCancel(id)}
            >
              <X className="size-4" />
            </Button>
          </div>
        );
      }

      if (status === "SENT") {
        return (
          <Button size="sm" disabled={isMoving} onClick={() => onReceive(id)}>
            <Check className="size-4" />
            Barang diterima
          </Button>
        );
      }

      return <span className="text-muted-foreground">-</span>;
    },
  },
];
