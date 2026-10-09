"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { PaymentResponseData } from "@repo/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CartItem } from "../pos-view";
import { toIDR } from "../../../../utils/format-money";
import {
  compressImage,
  MAX_UPLOAD_BYTES,
} from "../../../../utils/compress-image";
import { useAuth } from "@/stores/useAuth";
import { useActivePosStore } from "@/hooks/pos/use-active-store";
import { usePosTransactionOperations } from "@/hooks/management/pos-transaction/use-posTransaction-operations";

interface Props {
  total: number;
  cartPayload: CartItem[];
  onSuccess: () => void;
  paymentData: PaymentResponseData;
  transPosId: string | null;
  paymentId: string;
}

type Step = "scan" | "proof";

/**
 * Pembayaran lewat QRIS tercetak yang ditempel di meja kasir.
 *
 * Bedanya dengan QRIS Midtrans: kode di sini tidak membawa nominal dan sistem
 * tidak pernah tahu pembayarannya masuk atau belum. Karena itu alurnya sama
 * persis dengan transfer bank — kasir memastikan sendiri lalu mengunggah
 * buktinya, dan barulah transaksi berubah jadi lunas.
 *
 * Bukti WAJIB: tombol konfirmasi mati selama fotonya belum dipilih. Tanpa itu,
 * menandai lunas hanya bermodal ucapan, dan tidak ada yang bisa dicek ulang
 * kalau uangnya ternyata tidak masuk.
 */
export function QrisStaticPanel({
  total,
  cartPayload,
  onSuccess,
  paymentData,
  transPosId,
  paymentId,
}: Props) {
  const [step, setStep] = useState<Step>("scan");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    mutationPosTransactionData,
    uploadPaymentProofData,
    isLoadingUploadPaymentProofData,
    isLoadingmutationPosTransactionData,
  } = usePosTransactionOperations({});
  const user = useAuth((state) => state.user);
  const { storeId: activeStoreId } = useActivePosStore();

  const handleCreateTransaction = async () => {
    setError(null);

    if (!activeStoreId) {
      toast.error("Pilih toko terlebih dahulu", { position: "top-center" });
      return;
    }

    try {
      const result = await mutationPosTransactionData({
        storeId: activeStoreId,
        status: "PENDING",
        transId: transPosId,
        paymentMethodId: paymentId,
        cashierId: user?.id,
        itemTransaction: cartPayload.map((item) => ({
          price: Number(item.price),
          quantity: item.qty,
          productVariantId: item.productVariantId,
        })),
      });

      setTransactionId(result.data.id);
      setStep("proof");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat transaksi");
    }
  };

  const handleConfirm = async () => {
    if (!transactionId || !proofFile) return;
    setError(null);

    try {
      /// Foto HP biasanya 3–8 MB; dikecilkan dulu supaya permintaannya tidak
      /// melewati batas waktu padahal backend tetap menyelesaikannya.
      setIsPreparing(true);
      const compressed = await compressImage(proofFile);
      setIsPreparing(false);

      if (compressed.size > MAX_UPLOAD_BYTES) {
        setError(
          "Ukuran gambar masih di atas 2MB setelah dikecilkan. Coba foto ulang dengan resolusi lebih rendah.",
        );
        return;
      }

      const formData = new FormData();
      formData.append("paymentProof", compressed);

      await uploadPaymentProofData(
        { transPosId: transactionId, formData },
        { onSuccess: () => onSuccess() },
      );
    } catch (err) {
      setIsPreparing(false);
      setError(err instanceof Error ? err.message : "Konfirmasi gagal");
    }
  };

  return (
    <div>
      {step === "scan" && (
        <div className="flex flex-col">
          <div className="mb-4 rounded-xl border p-4 text-center">
            {paymentData.qrImage ? (
              <div className="relative mx-auto aspect-square w-52">
                <Image
                  src={paymentData.qrImage}
                  alt={`QRIS ${paymentData.merchantName ?? paymentData.name}`}
                  fill
                  sizes="208px"
                  className="object-contain"
                />
              </div>
            ) : (
              <p className="py-10 text-sm text-destructive">
                Gambar QR belum diunggah untuk metode ini. Lengkapi dulu di menu
                Metode Pembayaran.
              </p>
            )}

            {paymentData.merchantName && (
              <p className="mt-3 text-sm font-medium">
                {paymentData.merchantName}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Pastikan nama merchant di HP pembeli sama dengan yang tertera di
              atas.
            </p>

            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-sm text-muted-foreground">
                Nominal yang harus dibayar
              </span>
              <span className="font-semibold text-primary">{toIDR(total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Kode ini tidak membawa nominal — pembeli mengetiknya sendiri.
            </p>
          </div>

          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          <Button
            onClick={handleCreateTransaction}
            disabled={isLoadingmutationPosTransactionData}
          >
            {isLoadingmutationPosTransactionData
              ? "Membuat transaksi..."
              : "Pelanggan sudah bayar →"}
          </Button>
        </div>
      )}

      {step === "proof" && (
        <div>
          <div className="mb-4 rounded-xl bg-secondary/40 p-4 text-center">
            <p className="text-sm font-medium">Menunggu bukti pembayaran</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Minta pembeli menunjukkan layar bukti pembayaran QRIS-nya, lalu
              foto layarnya.
            </p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm text-muted-foreground">
              Unggah bukti pembayaran
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={(event) =>
                setProofFile(event.target.files?.[0] ?? null)
              }
            />
          </div>

          {proofFile && (
            <div className="mb-4 overflow-hidden rounded-lg border">
              {/* Pratinjau dari berkas lokal, bukan dari server — next/image
                  tidak dipakai karena sumbernya blob sementara. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(proofFile)}
                alt="Bukti pembayaran"
                className="max-h-48 w-full object-contain"
              />
            </div>
          )}

          {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

          <Button
            className="w-full"
            onClick={handleConfirm}
            disabled={
              !proofFile || isPreparing || isLoadingUploadPaymentProofData
            }
          >
            {isPreparing
              ? "Menyiapkan gambar..."
              : isLoadingUploadPaymentProofData
                ? "Mengkonfirmasi..."
                : "Konfirmasi Pembayaran"}
          </Button>
        </div>
      )}
    </div>
  );
}
