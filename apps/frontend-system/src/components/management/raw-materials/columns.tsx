"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MaterialsData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge";
import {toIDR} from "../../../../utils/format-money";

type RawMaterialsData = z.infer<typeof MaterialsData>
export const columnsRawMaterials = (
  setIdData: (id: string) => void,
  deleteById: (id: string) => void,
): ColumnDef<RawMaterialsData>[] => [
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
    accessorKey: "unit",
    header: "Unit",
  },
  {
    accessorKey: "cost",
    header: "Biaya Bahan Baku",
    cell: ({row}) => toIDR(row.original.cost)
  },
  {
    accessorKey: "isActive",
    header: "Status Pemakaian",
    cell: ({ row }) =>
      row.original.isActive ? <Badge>Aktif</Badge> : <Badge>Nonaktif</Badge>,
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