"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrderItemData, z } from "@repo/schemas";
import { toIDR } from "../../../../../utils/format-money";

type OrderItem = z.infer<typeof OrderItemData>;

export const columnsOrderItem = (): ColumnDef<OrderItem>[] => [
  {
    accessorKey: "productName",
    header: "Produk",
    cell: ({ row }) => <p className="text-start">{row.original.productName}</p>,
  },
  {
    accessorKey: "quantity",
    header: "Qty",
  },
  {
    accessorKey: "price",
    header: "Harga",
    cell: ({ row }) => <p>{toIDR(row.original.price)}</p>,
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
    cell: ({ row }) => <p>{toIDR(row.original.subtotal)}</p>,
  },
];
