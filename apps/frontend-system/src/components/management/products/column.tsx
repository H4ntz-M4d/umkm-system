"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import {
  ProductsData,
  ProductStatusEnum,
  ProductTypeEnum,
  z,
} from "@repo/schemas";

type ProductResponse = z.infer<typeof ProductsData>;
const typeData: Record<string, string> = {
  [ProductTypeEnum.enum.READY_STOCK]: "Siap di Jual",
  [ProductTypeEnum.enum.MADE_TO_ORDER]: "Made to Order",
  [ProductTypeEnum.enum.PRE_ORDER]: "Pre Order",
};

const statusData: Record<string, string> = {
  [ProductStatusEnum.enum.ACTIVE]: "Aktif",
  [ProductStatusEnum.enum.NONACTIVE]: "Tidak Aktif",
  [ProductStatusEnum.enum.DRAFT]: "Draft",
};

export const columnsProducts = (
  // setIdData: (id: string) => void,
  deleteStaffData: (id: string) => void,
): ColumnDef<ProductResponse>[] => [
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
      <p className={"max-w-75 truncate"}>{row.original.description}</p>
    ),
    size: 300,
  },
  {
    accessorKey: "useVariant",
    header: "Varian",
    cell: ({ row }) => <div>{row.original.useVariant ? "Ya" : "Tidak"}</div>,
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.original.type;
      if (type in typeData) {
        return <Badge variant={"outline"}>{typeData[type]}</Badge>;
      }
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      if (status in statusData) {
        return <Badge>{statusData[status]}</Badge>;
      }
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
            Hapus
          </Button>
        </div>
      );
    },
  },
];
