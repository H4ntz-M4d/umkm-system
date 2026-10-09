import type { Metadata } from "next";
import type { CustomerOrderDataType } from "@repo/schemas";
import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, MessageCircle, Store, Truck } from "lucide-react";
import { getCustomerToken } from "@/lib/api/server-token";
import { fetchMyOrderDetail } from "@/lib/queries/public/order.query";
import OrderStatusBadge from "@/components/public/orders/order-status";
import ReorderButton from "@/components/public/orders/reorder-button";
import { toIDR } from "../../../../../utils/format-money";
import { shopWhatsAppUrl } from "../../../../../utils/whatsapp";

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
  const remainingAmount = Number(data.totalAmount) - Number(data.dpAmount ?? 0);
  const isClosed = data.status === "CANCELLED" || data.status === "REFUNDED";
  const progress = orderProgress(data, remainingAmount);

  return (
    <main className="mx-auto px-4 md:px-8 py-8 md:py-12">
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
        <div className="flex flex-wrap items-center gap-3">
          <ReorderButton items={data.items} />
          <OrderStatusBadge status={data.status} />
        </div>
      </div>

      {/* Tidak ada lagi tombol bayar maupun penarik status dari Midtrans:
          harga, DP, dan pelunasan disepakati lewat WhatsApp, lalu dicatat
          admin. Yang ditampilkan di sini adalah keadaan kesepakatannya. */}
      <div
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 ${
          isClosed
            ? "border-border bg-muted/40"
            : "border-primary/30 bg-primary/5"
        }`}
      >
        <div>
          <p className="font-display font-semibold text-foreground">
            {progress.title}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {progress.message}
          </p>
        </div>
        {progress.showWhatsApp && (
          <a
            href={shopWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <MessageCircle size={16} />
            Hubungi lewat WhatsApp
          </a>
        )}
      </div>

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
                  {item.notes && (
                    <p className="mt-1.5 rounded-md bg-secondary/10 px-2 py-1 text-xs text-muted-foreground">
                      Permintaan: {item.notes}
                    </p>
                  )}
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
          {/* Pesanan yang diambil sendiri tidak punya baris pengiriman sama
              sekali, jadi tanpa blok ini halaman terlihat kehilangan informasi. */}
          {data.deliveryMethod === "PICKUP" && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-card-foreground">
                <Store size={16} className="text-primary" />
                Diambil Sendiri
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Pesanan ini diambil di rumah produksi. Waktu pengambilannya
                dijanjikan lewat WhatsApp.
              </p>
            </div>
          )}

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
                {/* Nomor resi baru terisi setelah paketnya diserahkan ke
                    kurir — sebelum itu barisnya tidak ditampilkan supaya
                    tidak terlihat seperti data yang hilang. */}
                {data.shipment.trackingNumber && (
                  <p className="mt-2 text-muted-foreground">
                    No. resi:{" "}
                    <span className="font-medium text-card-foreground">
                      {data.shipment.trackingNumber}
                    </span>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold text-card-foreground">
              Rincian Pembayaran
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Total item</span>
                <span>{data.totalItems}</span>
              </div>
              {/* Perkiraan awal tetap ditampilkan selama harganya belum
                  disepakati, supaya jelas angka mana yang masih bisa berubah. */}
              {data.status === "PENDING" ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Perkiraan awal</span>
                  <span>{toIDR(data.estimatedTotal)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>{isClosed ? "Sudah dibayar" : "DP dibayar"}</span>
                    <span>
                      {data.dpAmount ? toIDR(data.dpAmount) : "Belum ada"}
                    </span>
                  </div>
                  {/* Pesanan yang batal atau direfund tidak punya tagihan
                      lagi; menampilkan "Sisa" di situ cuma membingungkan. */}
                  {!isClosed && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sisa</span>
                      <span>{toIDR(Math.max(remainingAmount, 0))}</span>
                    </div>
                  )}
                </>
              )}
              {data.paymentMethodName && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Dibayar lewat</span>
                  <span>{data.paymentMethodName}</span>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-between border-t border-border pt-4">
              <span className="font-display font-semibold text-card-foreground">
                {data.status === "PENDING" ? "Belum disepakati" : "Total"}
              </span>
              <span className="font-display text-lg font-bold text-primary">
                {data.status === "PENDING" ? "—" : toIDR(data.totalAmount)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

/**
 * Keterangan tahap pesanan dalam bahasa customer.
 *
 * Satu tempat untuk seluruh status, termasuk yang baru dari alur nego
 * (Produksi Selesai) dan penutupnya (Batal, Refund) — sebelumnya cuma tiga
 * status pertama yang punya keterangan, sehingga pesanan Lunas ke atas
 * tampil tanpa penjelasan apa pun.
 */
function orderProgress(
  data: CustomerOrderDataType,
  remainingAmount: number,
): { title: string; message: string; showWhatsApp: boolean } {
  const isPickup = data.deliveryMethod === "PICKUP";
  const remaining = toIDR(Math.max(remainingAmount, 0));

  switch (data.status) {
    case "PENDING":
      return {
        title: "Menunggu kesepakatan",
        message:
          "Pesananmu sudah kami terima. Harga akhir dan DP-nya kita bicarakan lewat WhatsApp.",
        showWhatsApp: true,
      };
    case "DP":
      return {
        title: "DP sudah diterima",
        message: `Sisa yang perlu dilunasi ${remaining}. Kami hubungi lewat WhatsApp untuk kelanjutannya.`,
        showWhatsApp: true,
      };
    case "PRODUCTION_DONE":
      return {
        title: "Produk sudah selesai diproduksi",
        message: `Tinggal pelunasan ${remaining} sebelum ${isPickup ? "diambil" : "dikirim"}. Kami hubungi lewat WhatsApp untuk kelanjutannya.`,
        showWhatsApp: true,
      };
    case "PAID":
      return {
        title: "Pembayaran lunas",
        message: isPickup
          ? "Barangnya sudah kami sisihkan untukmu. Waktu pengambilan dijanjikan lewat WhatsApp."
          : "Barangnya sedang kami siapkan untuk dikirim. Nomor resi muncul di halaman ini begitu paketnya berangkat.",
        showWhatsApp: true,
      };
    case "SHIPPED":
      return {
        title: "Pesanan sedang dikirim",
        message: data.shipment?.trackingNumber
          ? `Paketmu sudah diserahkan ke ${data.shipment.courier}. Lacak dengan nomor resi di samping.`
          : "Paketmu sudah diserahkan ke kurir.",
        showWhatsApp: true,
      };
    case "COMPLETED":
      return {
        title: "Pesanan selesai",
        message: isPickup
          ? "Barangnya sudah diambil. Terima kasih sudah memesan di NurfaCraft."
          : "Barangnya sudah diterima. Terima kasih sudah memesan di NurfaCraft.",
        showWhatsApp: false,
      };
    case "CANCELLED":
      return {
        title: "Pesanan dibatalkan",
        message:
          "Pesanan ini sudah dibatalkan. Kalau ada yang perlu ditanyakan soal pembayaran, hubungi kami lewat WhatsApp.",
        showWhatsApp: true,
      };
    case "REFUNDED":
      return {
        title: "Dana sudah dikembalikan",
        message:
          "Pengembalian dana pesanan ini sudah kami proses. Hubungi kami lewat WhatsApp kalau belum kamu terima.",
        showWhatsApp: true,
      };
    default:
      return {
        title: "Status pesanan",
        message: "Kami hubungi lewat WhatsApp untuk kelanjutannya.",
        showWhatsApp: true,
      };
  }
}
