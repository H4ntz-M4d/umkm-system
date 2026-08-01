"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSnap } from "@/hooks/public/use-snap";
import { syncOrderPayment } from "@/lib/queries/public/order.query";
import { Button } from "@/components/ui/button";

/**
 * Melanjutkan pembayaran pesanan yang masih PENDING, memakai token Snap yang
 * sudah tersimpan saat checkout — jadi tidak perlu membuat order baru.
 */
export default function PayNowButton({
  orderId,
  snapToken,
}: {
  orderId: string;
  snapToken: string;
}) {
  const router = useRouter();
  const { pay } = useSnap();
  const [isPaying, setIsPaying] = useState(false);
  const [, startTransition] = useTransition();

  // Callback Snap tidak dipercaya sebagai penentu status. Tarik status dari
  // Midtrans dulu — kalau hanya router.refresh(), pesanan yang webhook-nya tidak
  // sampai akan tetap terlihat PENDING.
  const syncThenRefresh = () => {
    void syncOrderPayment(orderId)
      .catch(() => null)
      .finally(() => startTransition(() => router.refresh()));
  };

  const handlePay = async () => {
    setIsPaying(true);

    try {
      await pay(snapToken, {
        onSuccess: syncThenRefresh,
        onPending: syncThenRefresh,
        onError: () => {
          toast.error("Pembayaran gagal");
          syncThenRefresh();
        },
        onClose: syncThenRefresh,
      });
    } catch (error) {
      toast.error("Gagal membuka pembayaran", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Button onClick={handlePay} disabled={isPaying}>
      {isPaying ? "Membuka..." : "Bayar Sekarang"}
    </Button>
  );
}
