"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ExpenseData, z } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toIDR } from "../../../../utils/format-money";
import { dayjs } from "@repo/utils";
import { Paperclip } from "lucide-react";

type ExpenseDataRes = z.infer<typeof ExpenseData>;
const color = ["#cc5933", "#747a52", "#ccaa66", "#a16345", "#929d7b"];

export const columnsExpense = (
  deleteById: (id: string) => void,
  editById: (id: string) => void,
): ColumnDef<ExpenseDataRes>[] => [
  {
    accessorKey: "date",
    header: () => (
      <div className="flex justify-center">
        <p className="md:w-40">Tanggal</p>
      </div>
    ),
    cell: ({ row }) => (
      <p>{dayjs(row.original.date).locale("id").format("DD MMMM YYYY")}</p>
    ),
  },
  {
    accessorKey: "categoryName",
    header: () => <p className="text-start">Kategori</p>,
    cell: ({ row }) => {
      const currentCategory = row.original.categoryName;
      const pickColor = color[row.index % color.length];

      return (
        <div className="text-start">
          <Badge
            style={{ backgroundColor: `${pickColor}` }}
            className="min-w-25"
          >
            {currentCategory}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: () => <p className="text-start">Deskripsi</p>,
    cell: ({ row }) => (
      <div className="text-start max-w-70">
        <p className="w-full truncate">{row.original.description}</p>
      </div>
    ),
  },
  {
    accessorKey: "createdByName",
    header: "Diinput oleh",
    /// Diambil dari akun yang login saat pengeluaran dibuat, bukan diisi
    /// admin — itu maksud kolom ini.
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.original.createdByName ?? "-"}
      </p>
    ),
  },
  {
    accessorKey: "totalAmount",
    header: "Total Pengeluaran",
    cell: ({ row }) => toIDR(row.original.totalAmount),
  },
  {
    id: "proofs",
    header: "Bukti",
    /// Cuma penanda: URL fotonya tidak ikut dikirim ke daftar, dan yang perlu
    /// diketahui di sini hanya ada/tidaknya lampiran.
    cell: ({ row }) =>
      row.original.proofCount > 0 ? (
        <div
          className="flex items-center justify-center gap-1 text-muted-foreground"
          title={`${row.original.proofCount} foto bukti`}
        >
          <Paperclip className="h-4 w-4" />
          <span className="text-xs">{row.original.proofCount}</span>
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">—</p>
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
            onClick={() => editById(row.original.id.toString())}
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
