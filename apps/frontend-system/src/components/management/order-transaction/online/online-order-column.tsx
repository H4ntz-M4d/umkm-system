"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderData, OrderStatus, z } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { toIDR } from "../../../../../utils/format-money";

type OrderResponse = z.infer<typeof OrderData>;
type StatusType = z.infer<typeof OrderStatus>;

const statusMap: Record<StatusType, string> = {
  PENDING: "Menunggu",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  REFUNDED: "Dana Dikembalikan",
};

export const columnsOrder = (
  onView: (order: OrderResponse) => void,
  onCancel: (orderId: string) => void,
): ColumnDef<OrderResponse>[] => [
  {
    accessorKey: "expanded",
    header: () => null,
    cell: ({ row }) => (
      <button
        onClick={() => row.toggleExpanded()}
        className="p-1 hover:bg-slate-100 rounded-full transition-transform"
        style={{
          transform: row.getIsExpanded() ? "rotate(90deg)" : "rotate(0deg)",
        }}
      >
        <ChevronRight />
      </button>
    ),
  },
  {
    accessorKey: "orderId",
    header: "Order Id",
  },
  {
    accessorKey: "storeName",
    header: () => <p className="text-start">Nama Toko</p>,
    cell: ({ row }) => <p className="text-start">{row.original.storeName}</p>,
  },
  {
    accessorKey: "customerName",
    header: "Pelanggan",
  },
  {
    accessorKey: "paymentMethodName",
    header: "Metode Pembayaran",
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
      const status = row.original.status as StatusType;
      return <Badge>{statusMap[status] ?? status}</Badge>;
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
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => (
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => onView(row.original)}>
          Lihat
        </Button>
        {row.original.status === "PENDING" && (
          <Button
            variant="destructive"
            onClick={() => onCancel(row.original.orderId)}
          >
            Batalkan
          </Button>
        )}
      </div>
    ),
  },
];
