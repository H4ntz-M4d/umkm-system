"use client";

import { ColumnDef } from "@tanstack/react-table";
import { LowStockData, z } from "@repo/schemas";
import { dayjs } from "@repo/utils";
import { Badge } from "@/components/ui/badge";
import { ShoppingBasket, TriangleAlert } from "lucide-react";

type LowStock = z.infer<typeof LowStockData>;

const PRODUCT_TYPE_LABEL: Record<LowStock["type"], string> = {
  READY_STOCK: "Ready Stock",
  MADE_TO_ORDER: "Made To Order",
  PRE_ORDER: "Pre Order",
};

/**
 * Stok nol atau minus ditandai merah karena barangnya sudah tidak bisa dijual
 * sama sekali; sisanya kuning sebagai peringatan. Angka minus tetap ditampilkan
 * apa adanya, bukan dibulatkan ke nol, supaya kelainan datanya kelihatan.
 */
function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <TriangleAlert size={14} />
        {stock}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-primary text-primary">
      {stock}
    </Badge>
  );
}

export const columnsLowStock = (): ColumnDef<LowStock>[] => [
  {
    accessorKey: "no",
    header: "No",
    cell: ({ row }) => row.index + 1,
  },
  {
    /// Stok dipegang per toko, jadi satu varian bisa muncul lebih dari sekali —
    /// menipis di satu cabang, aman di cabang lain. Tanpa kolom ini, dua baris
    /// dengan produk dan SKU sama akan terbaca sebagai duplikat.
    accessorKey: "storeName",
    header: "Toko",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.storeName}</span>
    ),
  },
  {
    accessorKey: "productName",
    header: () => <p className="text-start">Nama Produk</p>,
    cell: ({ row }) => (
      <p className="flex items-center gap-3 text-start">
        <ShoppingBasket size={18} />
        {row.original.productName}
      </p>
    ),
  },
  {
    accessorKey: "variantLabel",
    header: "Varian",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.variantLabel || "-"}
      </span>
    ),
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.sku}</span>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipe Produk",
    cell: ({ row }) => (
      <Badge variant="outline">{PRODUCT_TYPE_LABEL[row.original.type]}</Badge>
    ),
  },
  {
    accessorKey: "stock",
    header: "Sisa Stok",
    cell: ({ row }) => <StockBadge stock={row.original.stock} />,
  },
  {
    accessorKey: "updatedAt",
    header: "Terakhir Berubah",
    cell: ({ row }) => (
      <span className="text-muted-foreground text-sm">
        {dayjs(row.original.updatedAt)
          .locale("id")
          .format("MMMM DD, YYYY - HH:mm")}
      </span>
    ),
  },
];
