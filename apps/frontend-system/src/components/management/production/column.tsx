"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { ProductionDataType } from "@repo/schemas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dayjs } from "@repo/utils";

/// Label status ditulis sekali di sini supaya papan, tabel, dan cetakan tidak
/// menyebut hal yang sama dengan nama berbeda.
export const PRODUCTION_STATUS_LABEL: Record<string, string> = {
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

export const columnsProduction = (
  onDelete: (id: string) => void,
  canManage = true,
): ColumnDef<ProductionDataType>[] => [
  {
    accessorKey: "code",
    header: "Kode Batch",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.code}</p>
        {row.original.parentCode && (
          <p className="text-xs text-muted-foreground">
            Lanjutan {row.original.parentCode}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "variantCount",
    header: "Varian",
    cell: ({ row }) => <p>{row.original.variantCount} varian</p>,
  },
  {
    id: "progress",
    header: "Kemajuan",
    /// Angka mentahnya ikut ditampilkan, bukan cuma persen: "320/500" yang
    /// menjawab pertanyaan berikutnya, yaitu berapa lagi yang kurang.
    cell: ({ row }) => {
      const { totalDelivered, totalTarget } = row.original;
      const percent =
        totalTarget > 0 ? Math.round((totalDelivered / totalTarget) * 100) : 0;

      return (
        <div className="min-w-32">
          <p className="text-sm">
            {totalDelivered}/{totalTarget} pcs
            <span className="ml-1 text-xs text-muted-foreground">
              ({percent}%)
            </span>
          </p>
          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
      );
    },
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
        {PRODUCTION_STATUS_LABEL[row.original.status] ?? row.original.status}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex justify-center gap-2">
        <Button variant="outline" asChild>
          <Link href={`/management/production/${row.original.id}`}>Detail</Link>
        </Button>
        {/* Batch yang sudah punya setoran tidak menawarkan Hapus: stoknya
            terlanjur bergerak, dan server pun menolaknya. */}
        {canManage && row.original.totalDelivered === 0 && (
          <Button
            variant="destructive"
            onClick={() => onDelete(row.original.id)}
          >
            Hapus
          </Button>
        )}
      </div>
    ),
  },
];
