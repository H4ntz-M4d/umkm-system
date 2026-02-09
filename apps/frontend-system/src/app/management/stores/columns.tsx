"use client"

import { ColumnDef } from "@tanstack/react-table"
import { StoreSchema } from "@repo/schemas"

export const columns: ColumnDef<typeof StoreSchema>[] = [
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
]