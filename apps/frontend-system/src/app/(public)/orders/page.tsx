import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Package } from "lucide-react";
import type { MyOrderQueryInput } from "@repo/schemas";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchMyOrders } from "@/lib/queries/public/order.query";
import OrderStatusBadge from "@/components/public/orders/order-status";
import { toIDR } from "../../../../utils/format-money";

const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: "Riwayat Pesanan | NurfaCraft",
};

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "PENDING", label: "Belum Bayar" },
  { value: "PAID", label: "Dibayar" },
  { value: "SHIPPED", label: "Dikirim" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const token = await getCustomerToken();
  if (!token) redirect("/login");

  const params = await searchParams;
  const statusParam = params.status;
  const status = (Array.isArray(statusParam) ? statusParam[0] : statusParam) as
    | MyOrderQueryInput["status"]
    | undefined;

  const orders = await fetchMyOrders({ limit: PAGE_SIZE, status }, token).catch(
    () => null,
  );
  const items = orders?.data ?? [];

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      <div className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
          Riwayat Pesanan
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Semua pesanan yang pernah kamu buat
        </p>
      </div>

      {/* Filter status lewat URL — halaman ini SSR, tanpa state client. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const isActive = (status ?? "") === filter.value;
          return (
            <Link
              key={filter.value || "all"}
              href={filter.value ? `/orders?status=${filter.value}` : "/orders"}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-primary bg-primary/10 font-medium text-primary"
                  : "border-border text-foreground/70 hover:bg-secondary"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="mx-auto text-muted-foreground/40" />
          <p className="font-display text-lg text-muted-foreground mt-4">
            Belum ada pesanan
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-terracotta-dark transition-colors"
          >
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((order) => (
            <Link
              key={order.orderId}
              href={`/orders/${order.orderId}`}
              className="block rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-bold text-card-foreground">
                    {order.orderId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(order.createdAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                {order.items.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="relative h-12 w-12 overflow-hidden rounded-lg bg-secondary/20"
                  >
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    )}
                  </div>
                ))}
                {order.items.length > 4 && (
                  <span className="text-xs text-muted-foreground">
                    +{order.items.length - 4} lainnya
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">
                  {order.totalItems} item
                </span>
                <span className="font-display font-bold text-primary">
                  {toIDR(order.totalAmount)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
