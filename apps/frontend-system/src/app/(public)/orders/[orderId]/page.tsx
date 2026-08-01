import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Truck } from "lucide-react";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchMyOrderDetail } from "@/lib/queries/public/order.query";
import OrderStatusBadge from "@/components/public/orders/order-status";
import OrderStatusPoller from "@/components/public/orders/order-status-poller";
import PayNowButton from "@/components/public/orders/pay-now-button";
import { toIDR } from "../../../../../utils/format-money";

type PageProps = { params: Promise<{ orderId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { orderId } = await params;
  return { title: `Pesanan ${orderId} | NurfaCraft` };
}

export default async function Page({ params }: PageProps) {
  const token = await getCustomerToken();
  if (!token) redirect("/login");

  const { orderId } = await params;
  const order = await fetchMyOrderDetail(orderId, token).catch(() => null);
  if (!order) notFound();

  const data = order.data;
  const isPending = data.status === "PENDING";

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Menarik status dari Midtrans selama masih menunggu bayar, supaya
          pesanan tidak menggantung PENDING kalau webhook tak kunjung sampai. */}
      <OrderStatusPoller orderId={data.orderId} status={data.status} />

      <Link
        href="/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
      >
        <ArrowLeft size={16} /> Kembali ke riwayat
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            {data.orderId}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(data.createdAt).toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
        </div>
        <OrderStatusBadge status={data.status} />
      </div>

      {isPending && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div>
            <p className="font-display font-semibold text-foreground">
              Menunggu pembayaran
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Selesaikan pembayaran agar pesananmu segera kami proses. Status
              akan diperbarui otomatis.
            </p>
          </div>
          {data.snapToken && (
            <PayNowButton orderId={data.orderId} snapToken={data.snapToken} />
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col lg:flex-row gap-8">
        {/* Item */}
        <section className="flex-1">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">
            Produk Dipesan
          </h2>
          <div className="space-y-4">
            {data.items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <Link
                  href={`/products/${item.slug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-secondary/20"
                >
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  )}
                </Link>
                <div className="flex flex-1 flex-col justify-center">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-display text-sm font-semibold text-card-foreground hover:text-primary transition-colors"
                  >
                    {item.productName}
                  </Link>
                  {Object.keys(item.options).length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {Object.entries(item.options)
                        .map(([type, value]) => `${type}: ${value}`)
                        .join(" · ")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {toIDR(item.price)} × {item.quantity}
                  </p>
                </div>
                <p className="self-center text-sm font-semibold text-foreground">
                  {toIDR(item.subtotal)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pengiriman & total */}
        <aside className="w-full lg:w-96 shrink-0 space-y-4">
          {data.shipment && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground">
                <MapPin size={16} className="text-primary" />
                Alamat Pengiriman
              </h2>
              <div className="mt-3 text-sm">
                <p className="font-semibold text-card-foreground">
                  {data.shipment.recipientName}
                </p>
                <p className="text-muted-foreground">{data.shipment.phone}</p>
                <p className="text-muted-foreground mt-1">
                  {data.shipment.addressLine}, {data.shipment.city},{" "}
                  {data.shipment.province}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-muted-foreground">
                  <Truck size={14} className="text-primary" />
                  {data.shipment.courier}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-card-foreground">
              Rincian Pembayaran
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Metode</span>
                <span>{data.paymentMethodName || "-"}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total item</span>
                <span>{data.totalItems}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Ongkir</span>
                <span className="font-medium text-secondary">
                  {Number(data.shipment?.shippingCost ?? 0) === 0
                    ? "Gratis"
                    : toIDR(data.shipment!.shippingCost)}
                </span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <span className="font-display font-semibold text-card-foreground">
                Total
              </span>
              <span className="font-display text-lg font-bold text-primary">
                {toIDR(data.totalAmount)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
