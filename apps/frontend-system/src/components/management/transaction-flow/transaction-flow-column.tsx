"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LedgerData, TransactionFlowDataType, z } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import {
  CircleArrowDown,
  CircleArrowUp,
  CirclePile,
  ShoppingBasket,
} from "lucide-react";

export const columnsTransactionFlow =
  (): ColumnDef<TransactionFlowDataType>[] => [
    {
      accessorKey: "id",
      header: "No",
      cell: ({ row }) => row.index + 1,
    },
    {
      accessorKey: "storeName",
      header: () => <p className="text-start">Nama Toko</p>,
      cell: ({ row }) => <p className="text-start">{row.original.storeName}</p>,
    },
    {
      accessorKey: "type",
      header: "Tipe",
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-3">
          {row.original.type === "IN" ? (
            <CircleArrowUp className="text-green-600" size={18} />
          ) : (
            <CircleArrowDown className="text-red-600" size={18} />
          )}
          <p>
            {row.original.type === "IN" ? "Stok Masuk" : "Stok Keluar"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Jumlah",
    },
    {
      accessorKey: "source",
      header: "Sumber Data",
      cell: ({ row }) => {
        const transactionFlowSource = row.original.source;

        const sourceLabels: Record<string, string> = {
          PRODUCTION: "Produksi",
          ORDER: "Transaksi Online",
          POS: "Transaksi Kasir",
          EXPENSE: "Pengeluaran",
        };

        const label = sourceLabels[transactionFlowSource] || transactionFlowSource;

        return (
          <Badge variant="default" className="w-25 text-center">
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Tanggal dibuat",
      cell: ({ row }) => (
        <p>
          {dayjs(row.original.createdAt)
            .locale("id")
            .format("MMMM DD, YYYY - HH:mm")}
        </p>
      ),
    },
  ];
