import type { CustomerOrderDataType } from "@repo/schemas";

type OrderStatus = CustomerOrderDataType["status"];

/// "Mengajukan", bukan "Menunggu Pembayaran": pesanan sekarang masuk lebih
/// dulu sebagai pengajuan, lalu harga dan DP-nya disepakati lewat WhatsApp.
const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Mengajukan",
  DP: "DP Dibayar",
  PRODUCTION_DONE: "Produksi Selesai",
  PAID: "Lunas",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dana Dikembalikan",
};

const STATUS_CLASS: Record<OrderStatus, string> = {
  PENDING: "bg-primary/10 text-primary",
  DP: "bg-amber-100 text-amber-700",
  PRODUCTION_DONE: "bg-amber-100 text-amber-700",
  PAID: "bg-secondary/20 text-secondary",
  SHIPPED: "bg-secondary/20 text-secondary",
  COMPLETED: "bg-secondary/20 text-secondary",
  CANCELLED: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-muted text-muted-foreground",
};

export function orderStatusLabel(status: OrderStatus) {
  return STATUS_LABEL[status] ?? status;
}

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
        STATUS_CLASS[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {orderStatusLabel(status)}
    </span>
  );
}
