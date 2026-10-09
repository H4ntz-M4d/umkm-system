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
  PENDING: "Mengajukan",
  DP: "DP Dibayar",
  PRODUCTION_DONE: "Produksi Selesai",
  PAID: "Lunas",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Batal",
  REFUNDED: "Dana Dikembalikan",
};

export const columnsOrder = (
  onView: (order: OrderResponse) => void,
  onCancel: (orderId: string) => void,
  onNegotiate: (order: OrderResponse) => void,
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
    accessorKey: "customerName",
    header: "Pelanggan",
  },
  {
    /// Perkiraan awal ikut ditampilkan selama harganya belum disepakati,
    /// supaya jelas angka mana yang masih bisa berubah.
    accessorKey: "totalAmount",
    header: "Nilai Pesanan",
    cell: ({ row }) =>
      row.original.status === "PENDING" ? (
        <p className="text-muted-foreground">
          ~{toIDR(row.original.estimatedTotal)}
        </p>
      ) : (
        <div>
          <p>{toIDR(row.original.totalAmount)}</p>
          {row.original.dpAmount && (
            <p className="text-xs text-muted-foreground">
              DP {toIDR(row.original.dpAmount)}
            </p>
          )}
        </div>
      ),
  },
  {
    accessorKey: "processedByName",
    header: "Diproses oleh",
    cell: ({ row }) => (
      <p className="text-muted-foreground">
        {row.original.processedByName ?? "-"}
      </p>
    ),
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
        {/* Nego hanya berarti selama pesanan belum tutup buku — status setelah
            itu ditolak service, jadi tombolnya pun tidak ditawarkan. */}
        {!["COMPLETED", "CANCELLED", "REFUNDED"].includes(
          row.original.status,
        ) && <Button onClick={() => onNegotiate(row.original)}>Nego</Button>}
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
