"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { ProductionData, ProductsData, z } from "@repo/schemas";

type ProductionResponse = z.infer<typeof ProductionData>;

export const columnsProduction = (
  setIdData: (id: string) => void,
  deleteData: (id: string) => void,
  setOpen?: (open: boolean) => void,
): ColumnDef<ProductionResponse>[] => [
  {
    accessorKey: "expanded",
    header: () => null,
    cell: ({ row }) => {
      return (
        <button
          onClick={() => row.toggleExpanded()}
          className="p-1 hover:bg-slate-100 rounded-full transition-transform"
          style={{
            transform: row.getIsExpanded() ? "rotate(90deg)" : "rotate(0deg)",
          }}
        >
          <ChevronRight />
        </button>
      );
    },
  },
  {
    accessorKey: "productName",
    header: "Produk Name",
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "quantityProduced",
    header: "Jumlah diproduksi",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <Badge>{row.original.status}</Badge>,
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({ row }) => (
      <p>
        {dayjs(row.original.createdAt).locale("id").format("MMMM DD, YYYY")}
      </p>
    ),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => {
              setOpen?.(true)
              setIdData(row.original.id);
            }}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteData(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
