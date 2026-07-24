"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  PosTransactionDataType,
  PostTransactionStatus,
  z,
} from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { toIDR } from "../../../../../utils/format-money";

type StatusType = z.infer<typeof PostTransactionStatus>;
const statusMap: Record<StatusType, string> = {
  PENDING: "Menunggu",
  PARKED: "Antrian",
  PAID: "Dibayar",
  CANCELLED: "Batal",
};
export const columnsPosTransaction =
  (): ColumnDef<PosTransactionDataType>[] => [
    {
      accessorKey: "transId",
      header: "POS Order Id",
    },
    {
      accessorKey: "storeName",
      header: () => <p className="text-start">Nama Toko</p>,
      cell: ({ row }) => <p className="text-start">{row.original.storeName}</p>,
    },
    {
      accessorKey: "cashierName",
      header: "Kasir",
    },
    {
      accessorKey: "paymentMethod",
      header: "Metode Pembayaran",
      cell: ({ row }) => <p>{row.original.paymentMethod}</p>,
    },
    {
      accessorKey: "totalAmount",
      header: "Jumlah Transaksi",
      cell: ({ row }) => <p>{toIDR(row.original.totalAmount)}</p>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const statusText = statusMap[status as StatusType];
        return <p>{statusText}</p>;
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
