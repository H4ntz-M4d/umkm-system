"use client";

/**
 * DORMAN — bagian dari alur bayar online Midtrans yang dinonaktifkan.
 *
 * Tidak dirujuk komponen mana pun sejak pemesanan dilanjutkan lewat WhatsApp
 * (harga dan DP disepakati di sana, lalu dicatat admin). Endpoint yang
 * dipanggilnya pun sudah dicabut dari controller backend, jadi memasangnya
 * kembali berarti menghidupkan rute itu lebih dulu.
 *
 * Sengaja tidak dihapus supaya alur lama bisa dikembalikan tanpa menulis ulang.
 */

import { useCallback } from "react";

type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks?: SnapCallbacks) => void;
    };
  }
}

/// snap.js dimuat lewat next/script, jadi saat tombol ditekan skrip-nya bisa
/// saja belum siap. Tunggu sebentar alih-alih langsung gagal.
async function waitForSnap(timeoutMs = 10000) {
  const startedAt = Date.now();

  while (!window.snap) {
    if (Date.now() - startedAt > timeoutMs) return null;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return window.snap;
}

export function useSnap() {
  const pay = useCallback(
    async (token: string, callbacks?: SnapCallbacks) => {
      const snap = await waitForSnap();

      if (!snap) {
        throw new Error(
          "Gagal memuat halaman pembayaran. Periksa koneksi lalu coba lagi.",
        );
      }

      snap.pay(token, callbacks);
    },
    [],
  );

  return { pay };
}
