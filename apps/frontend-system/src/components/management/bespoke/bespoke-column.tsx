"use client";

import { ColumnDef } from "@tanstack/react-table";
import { BespokeOrderDataType } from "@repo/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayjs } from "@repo/utils";
import { toIDR } from "../../../../utils/format-money";

/// Label berbahasa Indonesia, ditulis sekali di sini supaya papan dan tabel
/// tidak pernah menyebut status yang sama dengan dua nama berbeda.
export const BESPOKE_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Direncanakan",
  IN_PROGRESS: "Dikerjakan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_STYLE: Record<string, string> = {
  PLANNED: "bg-secondary/10 text-secondary border border-secondary",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border border-amber-300",
  COMPLETED: "bg-primary/10 text-primary border border-primary",
  CANCELLED: "bg-destructive/10 text-destructive border border-destructive",
};

export const columnsBespoke = (
  onEdit: (row: BespokeOrderDataType) => void,
  onChangeStatus: (row: BespokeOrderDataType) => void,
  onDelete: (id: string) => void,
  /// Pesanan custom disepakati dan ditagih pusat, jadi cabang hanya melihat.
  canManage = true,
): ColumnDef<BespokeOrderDataType>[] => [
  {
    accessorKey: "code",
    header: "Nomor",
    cell: ({ row }) => <p className="font-medium">{row.original.code}</p>,
  },
  {
    accessorKey: "title",
    header: () => <p className="text-start">Pesanan</p>,
    cell: ({ row }) => (
      <div className="text-start max-w-64">
        <p className="truncate">{row.original.title}</p>
        {/* Asal desain ditempel di baris jumlah karena keduanya saling
            menjelaskan: jumlah kecil hanya wajar bila mengikuti katalog. */}
        <p className="truncate text-xs text-muted-foreground">
          {row.original.quantity} pcs ·{" "}
          {row.original.productMasterName
            ? `Katalog: ${row.original.productMasterName}`
            : "Di luar katalog"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "customerName",
    header: () => <p className="text-start">Pemesan</p>,
    cell: ({ row }) => (
      <div className="text-start">
        <p>{row.original.customerName ?? "-"}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.customerPhone ?? "-"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "quotedPrice",
    header: "Harga Disepakati",
    cell: ({ row }) => toIDR(row.original.quotedPrice),
  },
  {
    accessorKey: "targetDate",
    header: "Target Selesai",
    cell: ({ row }) => (
      <p>{dayjs(row.original.targetDate).locale("id").format("DD MMM YYYY")}</p>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge className={STATUS_STYLE[row.original.status]}>
        {BESPOKE_STATUS_LABEL[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const isClosed =
        row.original.status === "COMPLETED" ||
        row.original.status === "CANCELLED";

      if (!canManage) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="flex gap-2 justify-center">
          {/* Pesanan yang sudah tutup buku tidak menawarkan tombol apa pun
              yang pasti ditolak server. */}
          {!isClosed && (
            <>
              <Button variant="outline" onClick={() => onEdit(row.original)}>
                Edit
              </Button>
              <Button onClick={() => onChangeStatus(row.original)}>
                Ubah Status
              </Button>
            </>
          )}
          {row.original.status !== "COMPLETED" && (
            <Button
              variant="destructive"
              onClick={() => onDelete(row.original.id)}
            >
              Hapus
            </Button>
          )}
        </div>
      );
    },
  },
];
