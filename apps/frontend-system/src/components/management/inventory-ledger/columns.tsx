"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LedgerData, z } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { CircleArrowDown, CircleArrowUp, CirclePile, ShoppingBasket } from "lucide-react";

type InventoryLedgerData = z.infer<typeof LedgerData>;
export const columnsLedgers = (): ColumnDef<InventoryLedgerData>[] => [
  {
    accessorKey: "id",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    accessorKey: "name",
    header: () => <p className="text-start">Nama Toko</p>,
    cell: ({ row }) => <p className="text-start">{row.original.name}</p>
  },
  {
    accessorKey: "itemName",
    header: () => <p className="text-start">Nama Item</p>,
    cell: ({ row }) => (
      <div>
        {row.original.itemType === "PRODUCT_VARIANT" ? (
          <p className="flex items-center gap-4">
            <ShoppingBasket size={18} /> {row.original.itemName}
          </p>
        ) : (
          <p className="flex items-center gap-4">
            <CirclePile size={18} /> {row.original.itemName}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "itemType",
    header: "Tipe Item",
    cell: ({ row }) => (
      <Badge variant={"outline"} className="w-25">
        {row.original.itemType === "PRODUCT_VARIANT"
          ? "Variant Produk"
          : "Bahan Baku"}
      </Badge>
    ),
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-3">
        {row.original.direction === "IN" ? (
          <CircleArrowUp className="text-green-600" size={18} />
        ) : (
          <CircleArrowDown className="text-red-600" size={18} />
        )}
        <p>{row.original.direction === "IN" ? "Stok Masuk" : "Stok Keluar"}</p>
      </div>
    )
  },
  {
    accessorKey: "quantity",
    header: "Jumlah",
  },
  {
    accessorKey: "source",
    header: "Sumber Data",
    cell: ({ row }) => {
      const ledgerSource = row.original.source;

      const sourceLabels: Record<string, string> = {
        PRODUCTION: "Produksi",
        ONLINE_ORDER: "Transaksi Online",
        POS: "Transaksi Kasir",
        PURCHASE: "Pengeluaran",
        ADJUSTMENT: "Pengaturan",
      };

      const label = sourceLabels[ledgerSource] || ledgerSource;

      return <Badge variant="default" className="w-25 text-center">{label}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Tanggal dibuat",
    cell: ({ row }) => (
      <p>
        {dayjs(row.original.createdAt).locale("id").format("MMMM DD, YYYY - HH:mm")}
      </p>
    ),
  },
];
