"use client";

import { ColumnDef } from "@tanstack/react-table";
import { StoreData } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dayjs } from "@repo/utils";

interface ColumnActions {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /// Daftar toko boleh dilihat cabang, tapi hanya pusat yang mengubahnya.
  canManage?: boolean;
}
export const columnsStore = ({
  onEdit,
  onDelete,
  canManage = true,
}: ColumnActions): ColumnDef<StoreData>[] => [
  {
    accessorKey: "id",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "isActive",
    header: "Status Toko",
    cell: ({ row }) =>
      row.original.isActive ? <Badge>Aktif</Badge> : <Badge>Nonaktif</Badge>,
  },
  {
    accessorKey: "isOnlineSource",
    header: "Penjualan online",
    cell: ({ row }) =>
      row.original.isOnlineSource ? (
        <Badge>Sumber online</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({ row }) => dayjs(row.original.createdAt).format("MMMM D, YYYY"),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      if (!canManage) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => onEdit(row.original.id.toString())}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => onDelete(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
