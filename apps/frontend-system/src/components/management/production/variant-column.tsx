"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ProductionMaterialData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button";

type ProductionMaterialResponse = z.infer<typeof ProductionMaterialData>;

export const columnsProductionMaterials = () // setIdData: (id: string) => void,
// deleteStaffData: (id: string) => void,
: ColumnDef<ProductionMaterialResponse>[] => [
  {
    accessorKey: "nameRawMaterial",
    header: () => "Nama Bahan Baku",
  },
  {
    accessorKey: "unitRawMaterial",
    header: () => "Unit Satuan",
  },
  {
    accessorKey: "quantityUsed",
    header: () => "Jumlah digunakan",
  },
];
