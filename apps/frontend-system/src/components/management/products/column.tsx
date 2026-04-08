"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductMaster } from "@/common/types";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";

export const columnsProducts = (
  // setIdData: (id: string) => void,
  deleteStaffData: (id: string) => void,
): ColumnDef<ProductMaster>[] => [
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
    accessorKey: "id",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: "Nama",
  },
  {
    accessorKey: "description",
    header: "Deskripsi",
    cell: ({ row }) => (
      <p className={"max-w-75 truncate"}>
        {row.original.description}
      </p>
    ),
    size: 300,
  },
  {
    accessorKey: "useVariant",
    header: "Variant",
    cell: ({ row }) => (
        <div>
          {row.original.useVariant ? "Ya" : "Tidak"}
        </div>
    )
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({row}) => (
      <Badge>
        {row.original.status}
      </Badge>
    )
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({row}) => (
      <p>
        {dayjs(row.original.createdAt).locale("id").format("MMMM DD, YYYY")}
      </p>
    )
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const router = useRouter();
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            onClick={() => {
              router.push(
                `/management/products/${row.original.id.toString()}/edit`,
              );
            }}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            onClick={() => deleteStaffData(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
