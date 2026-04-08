"use client"

import { ColumnDef } from "@tanstack/react-table"
import { StoreData } from "@repo/schemas"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import { dayjs } from "@repo/utils";

export const columnsStore = (
  setIdData: (id: string) => void,
  deleteById: (id: string) => void,
): ColumnDef<StoreData>[] => [
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
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({ row }) => dayjs(row.original.createdAt).format("MMMM D, YYYY"),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => setIdData(row.original.id.toString())}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteById(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];