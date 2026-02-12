"use client"

import { ColumnDef } from "@tanstack/react-table"
import { StoreResponse } from "@repo/schemas"

export const columnsStore: ColumnDef<StoreResponse>[] = [
  {
    accessorKey: "id"
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
]