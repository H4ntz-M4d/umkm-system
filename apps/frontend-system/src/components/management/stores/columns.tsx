"use client"

import { ColumnDef } from "@tanstack/react-table"
import { StoreResponse } from "@repo/schemas"
import { Button } from "@/components/ui/button"

export const columnsStore = (
  setIdData: (id: string) => void,
  deleteById: (id: string) => void
): ColumnDef<StoreResponse>[] => [
  {
    accessorKey: "id",
    header: "No",
    cell: ({row}) => row.index + 1
  },
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "isActive",
    header: "Status Aktif",
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
  },
  {
    id: 'actions',
    header: "Action",
    cell: ({row}) => {
      return (
      <div className="flex gap-2 justify-center">
        <Button variant={"outline"} onClick={() => setIdData(row.original.id.toString())}>
          Edit
        </Button>
        <Button variant={"destructive"} onClick={() => deleteById(row.original.id.toString())}>
          Delete
        </Button>
      </div>

      )
    }
  }
]