"use client";

import Link from "next/link";
import { ArrowRight, PackageCheck, TriangleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLowStockOperation } from "@/hooks/management/inventory-ledgers/use-low-stock-operation";
import { LOW_STOCK_THRESHOLD } from "@repo/schemas";
import { canAccessPath } from "@/lib/auth/route-access.config";

/// Cukup beberapa yang paling kritis; sisanya urusan halaman Stok Rendah.
const PREVIEW_LIMIT = 5;

/**
 * Kartu peringatan, bukan laporan. Tugasnya hanya membuat stok yang menipis
 * terlihat tanpa perlu membuka halamannya. Jumlah totalnya diambil dari
 * `meta.total`, jadi tidak perlu endpoint terpisah.
 *
 * Kartunya tampil untuk semua role manajemen, tapi tautan ke halaman Stok
 * Rendah hanya untuk role yang boleh membukanya — Kasir bisa melihat datanya di
 * sini tanpa diberi tautan yang ujungnya 404.
 */
export default function LowStockCard({ role }: { role?: string }) {
  const canOpenLowStockPage = canAccessPath("/management/low-stock", role);

  const { dataLowStock, isLoadingLowStock } = useLowStockOperation({
    skip: 0,
    limit: PREVIEW_LIMIT,
  });

  if (isLoadingLowStock && !dataLowStock) {
    return <Skeleton className="h-full min-h-64 w-full rounded-xl" />;
  }

  const items = dataLowStock?.data ?? [];
  const total = dataLowStock?.meta?.total ?? 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-primary" />
            Stok Rendah
          </span>
          {total > 0 && <Badge variant="destructive">{total}</Badge>}
        </CardTitle>
        <CardDescription>
          Varian dengan sisa stok di bawah {LOW_STOCK_THRESHOLD}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        {items.length === 0 ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <PackageCheck className="size-4" />
            Semua stok masih aman.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li
                /* Kunci gabungan: satu varian bisa muncul untuk beberapa toko. */
                key={`${item.variantId}-${item.storeId}`}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {item.productName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.storeName} · {item.variantLabel || item.sku}
                  </p>
                </div>
                <Badge
                  variant={item.stock <= 0 ? "destructive" : "outline"}
                  className={
                    item.stock <= 0 ? "" : "border-primary text-primary"
                  }
                >
                  {item.stock}
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {canOpenLowStockPage && (
          <Link
            href="/management/low-stock"
            className="flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            Lihat semua
            <ArrowRight className="size-4" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
