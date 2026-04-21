"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { ProductionData, z } from "@repo/schemas";
import DialogStatus from "./dialog-status";

type ProductionResponse = z.infer<typeof ProductionData>;

const status = [
  {
    id: "PLANNED",
    label: "Direncanakan",
    badgeStyle: "bg-blue-100 text-blue-700",
    pulseStyle: "w-2 h-2 bg-blue-600 rounded-full",
  },
  {
    id: "IN_PROGRESS",
    label: "Berjalan",
    badgeStyle: "bg-primary/15 text-primary",
    pulseStyle: "w-2 h-2 bg-primary rounded-full",
  },
  {
    id: "COMPLETED",
    label: "Selesai",
    badgeStyle: "bg-green-100 text-green-700",
    pulseStyle: "w-2 h-2 bg-green-600 rounded-full",
  },
  {
    id: "CANCELLED",
    label: "Dibatalkan",
    badgeStyle: "bg-red-100 text-red-700",
    pulseStyle: "w-2 h-2 bg-red-600 rounded-full",
  },
];

export const columnsProduction = (
  setIdData: (id: string) => void,
  deleteData: (id: string) => void,
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
    cell: ({ row }) => {
      const currentStatus = row.original.status;
      const statusConfig = status.find((s) => s.id === currentStatus);

      if (!statusConfig) {
        return <Badge>{currentStatus}</Badge>;
      }

      return (
        <Badge className={`${statusConfig.badgeStyle} border-none shadow-none`}>
          <div className="flex items-center gap-2">
            <span className={statusConfig.pulseStyle} />
            {statusConfig.label}
          </div>
        </Badge>
      );
    },
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
          <DialogStatus
            idData={row.original.id}
            statusData={row.original.status}
          />
          <Button
            variant={"outline"}
            onClick={() => {
              setIdData(row.original.id);
            }}
            disabled={row.original.status === "COMPLETED"}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteData(row.original.id.toString())}
            disabled={row.original.status === "COMPLETED"}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
