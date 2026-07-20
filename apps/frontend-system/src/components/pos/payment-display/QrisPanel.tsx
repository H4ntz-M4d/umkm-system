"use client";

import { useEffect, useRef, useState } from "react";
import { CartItem } from "../pos-view";
import { AlertCircle, CircleCheck, Clipboard, ClockAlert } from "lucide-react";
import { toIDR } from "../../../../utils/format-money";
import { useAuth } from "@/stores/useAuth";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { getStatusTransaction } from "@/lib/queries/pos-transaction/pos-transaction.query";
import { setTimeout } from "timers";
import Image from "next/image";

interface Props {
  total: number;
  cartPayload: CartItem[];
  onSuccess: () => void;
  transPosId: string | null;
  paymentId: string;
}

type QrisState = "idle" | "loading" | "waiting" | "paid" | "expired" | "error";
const POLL_INTERVAL = 3000; // cek setiap 3 detik
const QR_TIMEOUT = 5 * 60 * 1000; // expired setelah 5 menit

export function QrisPanel({
  total,
  cartPayload,
  onSuccess,
  transPosId,
  paymentId,
}: Props) {
  const [qrisState, setQrisState] = useState<QrisState>("idle");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(QR_TIMEOUT / 1000);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const { mutationPosTransactionData, isLoadingmutationPosTransactionData } =
    usePosTransactionOperations({});
  const cashier = useAuth((state) => state.user);

  const startPolling = (transPosId: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await getStatusTransaction(transPosId);
        if (res.data.status === "PAID") {
          stopPolling();
          setQrisState("paid");
          setTimeout(onSuccess, 1500);
        }
      } catch (error) {}
    }, POLL_INTERVAL);
  };

  const startCountdown = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          stopPolling();
          setQrisState("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const generateQr = async () => {
    setError(null);
    setTimeLeft(QR_TIMEOUT / 1000);
    setQrisState('loading')
    try {
      if (!cashier || !cashier.storeId) return;
      const result = await mutationPosTransactionData({
        storeId: cashier.storeId,
        cashierId: cashier.id,
        status: "PENDING",
        transId: transPosId,
        paymentMethodId: paymentId,
        itemTransaction: cartPayload.map((c) => ({
          price: Number(c.price),
          quantity: c.qty,
          productVariantId: c.productVariantId,
        })),
      });

      setQrUrl(result.data?.qrUrl ?? null);
      setQrisState("waiting");
      setTransactionId(result.data.id);
      startPolling(result.data.id);
      startCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat transaksi");
    }
  };

  const hasGenerated = useRef(false)

  useEffect(() => {
    if (hasGenerated.current) return
    hasGenerated.current = true;
    generateQr();
    return () => stopPolling();
  }, []);

  return (
    <div>
      <div className="flex flex-col">
        <div className="rounded-xl p-4 mb-4">
          {qrisState === "loading" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <i className="ti ti-loader-2 text-3xl text-blue-500 animate-spin" />
              <p className="text-sm text-gray-500">Membuat QR code...</p>
            </div>
          )}

          {qrisState === "waiting" && (
            <div className="flex flex-col items-center">
              <p className="text-sm text-gray-500 mb-3">
                Scan QR code berikut untuk membayar
              </p>

              <div className="border-2 border-blue-200 rounded-2xl p-3 mb-3">
                <Image
                  src={qrUrl || ""}
                  alt="QRIS Payment"
                  width={350}
                  height={350}
                  unoptimized // QR dari Midtrans, bukan aset lokal
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <i className="ti ti-clock" />
                <span>Berlaku {formatTime(timeLeft)}</span>
              </div>

              <p className="text-lg font-semibold text-blue-700 mb-4">
                {toIDR(total)}
              </p>

              <div className="flex items-center gap-2 text-sm text-gray-400">
                <i className="ti ti-loader-2 animate-spin text-xs" />
                <span>Menunggu pembayaran...</span>
              </div>
            </div>
          )}

          {qrisState === "paid" && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="size-20 bg-green-100 rounded-full flex items-center justify-center">
                <CircleCheck color="green" size={100} />
              </div>
              <p className="text-lg font-medium text-green-700">
                Pembayaran berhasil!
              </p>
              <p className="text-base text-gray-500">Transaksi selesai</p>
            </div>
          )}

          {qrisState === "expired" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="size-20 bg-red-100 rounded-full flex items-center justify-center">
                <ClockAlert color="red" size={100} />
              </div>
              <p className="text-lg font-medium text-red-600">
                QR code kadaluarsa
              </p>
              <button
                onClick={generateQr}
                className="mt-2 px-6 py-2 bg-primary text-white rounded-xl text-sm"
              >
                Generate ulang
              </button>
            </div>
          )}

          {qrisState === "error" && (
            <div className="flex flex-col items-center py-6 gap-3">
              <AlertCircle size={100} color="red" />
              <p className="text-base text-red-500">{error}</p>
              <button
                onClick={generateQr}
                className="px-6 py-2 bg-primary text-white rounded-xl text-sm"
              >
                Coba lagi
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      </div>
    </div>
  );
}
