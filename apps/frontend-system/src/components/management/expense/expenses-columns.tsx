"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExpenseData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toIDR } from "../../../../utils/format-money";
import { dayjs } from "@repo/utils";

type ExpenseDataRes = z.infer<typeof ExpenseData>;
export const columnsExpense = (
  // setIdData: (id: string) => void,
  // deleteById: (id: string) => void,
): ColumnDef<ExpenseDataRes>[] => [
  {
    accessorKey: "date",
    header: "Tanggal",
    cell: ({ row }) => (
      <p>{dayjs(row.original.date).locale("id").format("DD MMMM YYYY")}</p>
    ),
  },
  {
    accessorKey: "categoryName",
    header: "Kategori",
  },
  {
    accessorKey: "description",
    header: () => <p className="text-start">Deskripsi</p>,
    cell: ({ row }) => (
      <div className="text-start max-w-70">
        <p className="w-full truncate">{row.original.description}</p>
      </div>
    )
  },
  {
    accessorKey: "totalAmount",
    header: "Total Pengeluaran",
    cell: ({ row }) => toIDR(row.original.totalAmount),
  },
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant={"outline"}
            // onClick={() => setIdData(row.original.id.toString())}
          >
            Edit
          </Button>
          <Button
            variant={"destructive"}
            // onClick={() => deleteById(row.original.id.toString())}
          >
            Delete
          </Button>
        </div>
      );
    },
  },
];
