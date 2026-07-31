"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { syncOrderPayment } from "@/lib/queries/public/order.query";

/**
 * Menjaga status pesanan tetap sesuai kenyataan selama halaman dibuka.
 *
 * Tidak cukup sekadar router.refresh(): kalau notifikasi webhook Midtrans tidak
 * pernah sampai (URL salah, server sempat mati), status di basis data akan
 * bertahan PENDING selamanya dan refresh berapa kali pun hasilnya sama. Karena
 * itu tiap putaran memanggil endpoint sync yang menanyakan status sebenarnya ke
 * Midtrans lebih dulu, baru menyegarkan halaman.
 *
 * Berhenti sendiri begitu status bukan PENDING, dan dibatasi jumlah percobaannya
 * supaya tab yang ditinggal terbuka tidak memanggil Midtrans selamanya.
 */
export default function OrderStatusPoller({
  orderId,
  status,
  intervalMs = 5000,
  maxAttempts = 24,
}: {
  orderId: string;
  status: string;
  intervalMs?: number;
  maxAttempts?: number;
}) {
  const router = useRouter();
  // Ref, bukan state: perubahannya tidak boleh memicu render ulang.
  const isRunning = useRef(false);

  useEffect(() => {
    if (status !== "PENDING") return;

    let attempts = 0;
    let cancelled = false;

    const check = async () => {
      // Lewati kalau putaran sebelumnya masih berjalan, supaya permintaan tidak
      // menumpuk saat jaringan lambat.
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        await syncOrderPayment(orderId);
        if (!cancelled) router.refresh();
      } catch {
        // Gagal menyelaraskan bukan alasan menghentikan polling — percobaan
        // berikutnya bisa saja berhasil.
      } finally {
        isRunning.current = false;
      }
    };

    // Periksa sekali di awal: pembeli yang baru kembali dari Midtrans tidak
    // perlu menunggu satu interval penuh.
    void check();

    const timer = setInterval(() => {
      attempts += 1;
      if (attempts > maxAttempts) {
        clearInterval(timer);
        return;
      }
      void check();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId, status, intervalMs, maxAttempts, router]);

  return null;
}
