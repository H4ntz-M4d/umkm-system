// components/pos/payment/CashPanel.tsx
"use client";

import { useState } from "react";
import { CartItem } from "../pos-view";
import { Button } from "@/components/ui/button";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { AdminUser, useAuth } from "@/stores/useAuth";
import loading from "@/app/management/stores/loading";

interface Props {
  total: number;
  transPosId: string | null;
  paymentId: string;
  cartPayload: CartItem[];
  onSuccess: () => void;
}

export function CashPanel({
  total,
  cartPayload,
  onSuccess,
  transPosId,
  paymentId,
}: Props) {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const { mutationPosTransactionData, isLoadingmutationPosTransactionData } = usePosTransactionOperations({});
  const user = useAuth((state) => state.user);
  const loading = isLoadingmutationPosTransactionData;
  const change = cashAmount - total;
  const isValid = cashAmount >= total;

  const onBack = () => {};

  // Nominal cepat
  const QUICK_AMOUNTS = [
    Math.ceil(total / 10000) * 10000, // bulatkan ke 10rb terdekat
    Math.ceil(total / 50000) * 50000, // bulatkan ke 50rb terdekat
    Math.ceil(total / 100000) * 100000, // bulatkan ke 100rb terdekat
  ].filter((v, i, arr) => arr.indexOf(v) === i && v >= total); // unik dan >= total

  const handleConfirm = async (cashier: AdminUser | null) => {
    if (!isValid) return;
    setError(null);
    try {
      if (!cashier || !cashier.storeId) return;
      await mutationPosTransactionData({
        storeId: cashier.storeId,
        cashierId: cashier.id,
        status: "PAID",
        transId: transPosId,
        paymentMethodId: paymentId,
        itemTransaction: cartPayload.map((c) => ({
          price: Number(c.price),
          quantity: c.qty,
          productVariantId: c.productVariantId,
        })),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaksi gagal");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <label className="text-sm text-gray-500 mb-1 block">
          Uang diterima
        </label>
        <input
          type="number"
          value={cashAmount || ""}
          onChange={(e) => setCashAmount(Number(e.target.value))}
          placeholder="0"
          className="w-full border rounded-lg px-3 py-2 text-lg font-medium"
          autoFocus
        />
      </div>

      {/* Nominal cepat */}
      <div className="flex gap-2 mb-4">
        {QUICK_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => setCashAmount(amount)}
            className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50"
          >
            {formatRupiah(amount)}
          </button>
        ))}
      </div>

      {/* Kembalian */}
      <div className="rounded-xl p-4 mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Total</span>
          <span>{formatRupiah(total)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>Dibayar</span>
          <span>{formatRupiah(cashAmount)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Kembalian</span>
          <span className={change < 0 ? "text-red-500" : "text-green-600"}>
            {formatRupiah(Math.max(change, 0))}
          </span>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <Button
        onClick={() => handleConfirm(user)}
        disabled={!isValid || loading}
        className="w-full"
      >
        {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
      </Button>
    </div>
  );
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
