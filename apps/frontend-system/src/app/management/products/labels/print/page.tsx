"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBarcodeLabelOperation } from "@/hooks/management/products/use-barcode-label-operation";
import { BarcodeLabel } from "@/components/management/products/barcode-label/barcode-label";
import { renderCode128 } from "@/components/management/products/barcode-label/code128";
import {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  MAX_LABELS_PER_PRINT,
} from "@/components/management/products/barcode-label/label-config";

/**
 * Halaman cetak label barcode — satu label per halaman kertas.
 *
 * SKU dan harga sengaja dibaca ulang dari server berdasarkan `variantId`, bukan
 * diterima dari URL: label yang tertempel di barang tidak boleh bisa memuat SKU
 * hasil salah ketik atau URL yang diutak-atik. Dari URL cuma jumlahnya.
 */
export default function Page() {
  const searchParams = useSearchParams();
  const variantId = searchParams.get("variantId");
  const requestedQty = Number(searchParams.get("qty"));
  const quantity = Number.isInteger(requestedQty)
    ? Math.min(Math.max(requestedQty, 1), MAX_LABELS_PER_PRINT)
    : 1;

  const { variantLabelData, isLoadingVariantLabel, variantLabelError } =
    useBarcodeLabelOperation({ variantId });

  const [barcodeSvg, setBarcodeSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const hasPrinted = useRef(false);

  const sku = variantLabelData?.sku;

  // jsbarcode butuh DOM, jadi barcode dibuat di effect setelah data tiba —
  // sekali saja, lalu dipakai ulang oleh semua label.
  useEffect(() => {
    if (!sku) return;
    try {
      setBarcodeSvg(renderCode128(sku).svg);
    } catch {
      setRenderError(`SKU "${sku}" tidak bisa dijadikan barcode Code 128.`);
    }
  }, [sku]);

  useEffect(() => {
    if (!barcodeSvg || hasPrinted.current) return;

    // Dialog cetak dibuka setelah barcode siap; kalau terlalu cepat, yang
    // tercetak halaman kosong.
    hasPrinted.current = true;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [barcodeSvg]);

  if (!variantId) {
    return <PrintMessage text="Varian tidak disebutkan di alamat halaman." />;
  }
  if (isLoadingVariantLabel) {
    return <PrintMessage text="Memuat data label..." />;
  }
  if (variantLabelError || !variantLabelData) {
    return (
      <PrintMessage
        text={variantLabelError?.message ?? "Data varian tidak ditemukan."}
      />
    );
  }
  if (renderError) {
    return <PrintMessage text={renderError} />;
  }

  return (
    <>
      {/* Aturan halaman khusus label. Menimpa `@page { margin: 14mm }` global
          yang dibuat untuk laporan A4 — tanpa ini label tergeser dan terpotong. */}
      <style>{`
        @media print {
          @page {
            size: ${LABEL_WIDTH_MM}mm ${LABEL_HEIGHT_MM}mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }
          body * {
            visibility: hidden;
          }
          .label-sheet, .label-sheet * {
            visibility: visible;
          }
          .label-sheet {
            position: absolute;
            top: 0;
            left: 0;
            gap: 0 !important;
            padding: 0 !important;
          }
          .label-sheet .barcode-label {
            border: none !important;
            break-after: page;
            page-break-after: always;
          }
          .label-sheet .barcode-label:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 px-6 py-6 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="font-instrument text-3xl">Label Barcode</h1>
            <p className="text-sm text-muted-foreground">
              {variantLabelData.productName}
              {variantLabelData.variantLabel &&
                ` — ${variantLabelData.variantLabel}`}{" "}
              · {quantity} label · {LABEL_WIDTH_MM} x {LABEL_HEIGHT_MM} mm
            </p>
            <p className="text-xs text-muted-foreground">
              Atur ukuran kertas di driver printer thermal ke {LABEL_WIDTH_MM} x{" "}
              {LABEL_HEIGHT_MM} mm dengan margin 0 sebelum mencetak.
            </p>
          </div>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" />
            Cetak
          </Button>
        </div>
      </div>

      {barcodeSvg ? (
        // Label langsung jadi anak `.label-sheet` tanpa pembungkus: aturan
        // pindah halaman memakai `:last-child`, yang tidak akan cocok kalau
        // tiap label dibungkus elemennya sendiri.
        <div className="label-sheet flex flex-wrap gap-3 px-6 pb-8 [&_.barcode-label]:border [&_.barcode-label]:border-dashed [&_.barcode-label]:border-neutral-300">
          {Array.from({ length: quantity }, (_, index) => (
            <BarcodeLabel
              key={index}
              svg={barcodeSvg}
              sku={variantLabelData.sku}
              price={variantLabelData.price}
            />
          ))}
        </div>
      ) : (
        <PrintMessage text="Menyiapkan barcode..." />
      )}
    </>
  );
}

function PrintMessage({ text }: { text: string }) {
  return (
    <p className="px-6 py-10 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
