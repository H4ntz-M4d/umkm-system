// components/pos/payment/TransferPanel.tsx
"use client";

import { useState } from "react";
import { CartItem } from "../pos-view";
import { Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PAYMENT_METHOD } from "../pos-payment-dialog";

interface Props {
  method: "TRANSFER_BNI" | "TRANSFER_BRI";
  total: number;
  cartPayload: CartItem[];
  onSuccess: () => void;
  paymentData: PAYMENT_METHOD;
}

type Step = "info" | "waiting" | "proof";

export function TransferPanel({
  method,
  total,
  cartPayload,
  paymentData,
  onSuccess,
}: Props) {
  const [step, setStep] = useState<Step>("info");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: buat transaksi, tampilkan info rekening
  const handleCreateTransaction = async () => {
    setLoading(true);
    setError(null);
    try {
      // setTransactionId(result.id);
      setStep("waiting");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat transaksi");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: kasir upload bukti dan konfirmasi
  const handleConfirm = async () => {
    if (!transactionId || !proofFile) return;
    setLoading(true);
    setError(null);
    try {
      // Upload bukti ke storage dulu (Cloudinary/S3)
      const proofUrl = await uploadProof(proofFile);
      //   await confirmTransfer(transactionId, proofUrl)
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Konfirmasi gagal");
    } finally {
      setLoading(false);
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
                <span className="font-medium">{paymentData.code}</span>
                <Button
                  variant={"ghost"}
                  className="size-1"
                  onClick={() => navigator.clipboard.writeText(String(paymentData.code))}
                >
                  <Clipboard />
                </Button>
              </div>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Atas Nama</span>
              <span className="font-medium">Nurkayekti</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-sm text-gray-500">Nominal Transfer</span>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-primary">
                  {formatRupiah(total)}
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

          <Button onClick={handleCreateTransaction} disabled={loading}>
            {loading ? "Membuat transaksi..." : "Pelanggan sudah transfer →"}
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
            <input
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
            disabled={!proofFile || loading}
            className="w-full bg-green-600 text-white rounded-xl py-3 font-medium disabled:opacity-50"
          >
            {loading ? "Mengkonfirmasi..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      )}
    </div>
  );
}

async function uploadProof(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/upload/payment-proof", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload bukti gagal");
  const data = await res.json();
  return data.url;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
