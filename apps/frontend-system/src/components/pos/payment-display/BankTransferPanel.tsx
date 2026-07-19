// components/pos/payment/TransferPanel.tsx
"use client";

import { useState } from "react";
import { CartItem } from "../pos-view";
import { Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentResponseData } from "@repo/schemas";
import { toIDR } from "../../../../utils/format-money";
import { AdminUser, useAuth } from "@/lib/queries/auth/useAuth";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";
import { Input } from "@/components/ui/input";
import loading from "@/app/management/stores/loading";

interface Props {
  total: number;
  cartPayload: CartItem[];
  onSuccess: () => void;
  paymentData: PaymentResponseData;
  transPosId: string | null;
  paymentId: string;
}

type Step = "info" | "waiting" | "proof";

export function TransferPanel({
  total,
  cartPayload,
  paymentData,
  onSuccess,
  transPosId,
  paymentId,
}: Props) {
  const [step, setStep] = useState<Step>("info");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    mutationPosTransactionData,
    uploadPaymentProofData,
    isLoadingUploadPaymentProofData,
    isLoadingmutationPosTransactionData,
  } = usePosTransactionOperations({});
  const user = useAuth((state) => state.user);

  // Step 1: buat transaksi, tampilkan info rekening
  const handleCreateTransaction = async (cashier: AdminUser | null) => {
    setError(null);
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

      setTransactionId(result.data.id);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat transaksi");
    }
  };

  // Step 2: kasir upload bukti dan konfirmasi
  const handleConfirm = async () => {
    if (!transactionId || !proofFile) return;
    setError(null);
    try {
      const formData = new FormData();
      formData.append("paymentProof", proofFile);

      await uploadPaymentProofData(
        {
          transPosId: transactionId,
          formData: formData,
        },
        {
          onSuccess: () => {
            onSuccess();
          },
        },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Konfirmasi gagal");
    }
  };

  return (
    <div>
      {/* Step 1: info rekening */}
      {step === "info" && (
        <div className="flex flex-col">
          <div className="rounded-xl p-4 mb-4">
            <p className="text-sm text-gray-500 mb-3">
              Transfer ke rekening {paymentData.name}
            </p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">No. Rekening</span>
              <div className="flex items-center gap-1">
                <span className="font-medium">{paymentData.accountNumber}</span>
                <Button
                  variant={"ghost"}
                  className="size-1"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      String(paymentData.accountNumber),
                    )
                  }
                >
                  <Clipboard />
                </Button>
              </div>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Atas Nama</span>
              <span className="font-medium">{paymentData.accountName}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-sm text-gray-500">Nominal Transfer</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">
                  {toIDR(total)}
                </span>
                <Button
                  variant={"link"}
                  className="size-1"
                  onClick={() => navigator.clipboard.writeText(String(total))}
                >
                  <Clipboard />
                </Button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <Button
            onClick={() => handleCreateTransaction(user)}
            disabled={isLoadingmutationPosTransactionData}
          >
            {isLoadingmutationPosTransactionData ? "Membuat transaksi..." : "Pelanggan sudah transfer →"}
          </Button>
        </div>
      )}

      {/* Step 2: kasir upload bukti */}
      {step === "waiting" && (
        <div>
          <div className="bg-green-50 rounded-xl p-4 mb-4 text-center">
            <i className="ti ti-clock text-2xl text-green-600 mb-2 block" />
            <p className="text-sm font-medium text-green-700">
              Menunggu konfirmasi transfer
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Minta pelanggan tunjukkan bukti transfer
            </p>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-500 mb-2 block">
              Upload bukti transfer
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {proofFile && (
            <div className="mb-4 rounded-lg overflow-hidden border">
              <img
                src={URL.createObjectURL(proofFile)}
                alt="Bukti transfer"
                className="w-full object-contain max-h-48"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

          <button
            onClick={handleConfirm}
            disabled={!proofFile || isLoadingUploadPaymentProofData}
            className="w-full bg-green-600 text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            {isLoadingUploadPaymentProofData ? "Mengkonfirmasi..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      )}
    </div>
  );
}
