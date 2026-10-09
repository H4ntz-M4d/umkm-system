"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Barcode, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBarcodeLabelOperation } from "@/hooks/management/products/use-barcode-label-operation";
import { toIDR } from "../../../../../utils/format-money";
import { estimateModuleWidthMm, renderCode128 } from "./code128";
import {
  LABEL_HEIGHT_MM,
  LABEL_WIDTH_MM,
  MAX_LABELS_PER_PRINT,
  MIN_READABLE_MODULE_MM,
} from "./label-config";

interface PrintLabelDialogProps {
  variantId: string;
  sku: string;
}

/**
 * Tombol + dialog konfirmasi cetak label barcode satu varian.
 *
 * Jumlah label default mengikuti stok varian di toko yang dipilih — label
 * dicetak di tempat barangnya berada. Toko default-nya rumah produksi, karena
 * label paling sering dicetak begitu hasil produksi masuk.
 *
 * Pilihan toko dan isian jumlah disimpan sebagai `null` = "pakai default",
 * bukan disalin ke state lewat effect saat data tiba: default-nya dihitung
 * langsung dari data, jadi tidak ada render berantai dan tidak ada nilai basi
 * kalau stoknya berubah.
 */
export function PrintLabelDialog({ variantId, sku }: PrintLabelDialogProps) {
  const [open, setOpen] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [quantityInput, setQuantityInput] = useState<string | null>(null);
  const [moduleWidthMm, setModuleWidthMm] = useState<number | null>(null);

  const { variantLabelData, isLoadingVariantLabel, variantLabelError } =
    useBarcodeLabelOperation({ variantId: open ? variantId : null });

  // Lebar batang hanya bisa dihitung di browser (butuh DOM), jadi di effect.
  // Yang disimpan hasil hitung dari sistem luar (jsbarcode), bukan turunan state.
  useEffect(() => {
    if (!open) return;
    try {
      setModuleWidthMm(estimateModuleWidthMm(renderCode128(sku).moduleCount));
    } catch {
      setModuleWidthMm(null);
    }
  }, [open, sku]);

  const stocks = variantLabelData?.stocks ?? [];
  const defaultStore =
    stocks.find((store) => store.isProductionHouse) ?? stocks[0];
  const selectedStore =
    stocks.find((store) => store.storeId === storeId) ?? defaultStore;
  const storeStock = selectedStore?.stock ?? 0;

  /// Stok 0 tetap menawarkan 1 label, bukan 0 — mencetak nol label tidak ada
  /// artinya, dan label untuk barang yang baru datang memang sering dicetak
  /// sebelum stoknya tercatat.
  const defaultQuantity = Math.min(
    Math.max(storeStock, 1),
    MAX_LABELS_PER_PRINT,
  );
  const quantityText = quantityInput ?? String(defaultQuantity);
  const quantity = Number(quantityText);

  const quantityError = !/^\d+$/.test(quantityText)
    ? "Jumlah label harus berupa angka bulat"
    : quantity < 1
      ? "Minimal 1 label"
      : quantity > MAX_LABELS_PER_PRINT
        ? `Maksimal ${MAX_LABELS_PER_PRINT} label sekali cetak`
        : null;

  const isBarcodeTooDense =
    moduleWidthMm !== null && moduleWidthMm < MIN_READABLE_MODULE_MM;

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) {
      // Dibuka ulang selalu mulai dari default terbaru, bukan sisa isian lama.
      setStoreId(null);
      setQuantityInput(null);
    }
  };

  const handlePrint = () => {
    if (quantityError) return;

    const params = new URLSearchParams({
      variantId,
      qty: String(quantity),
    });
    window.open(
      `/management/products/labels/print?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Barcode className="size-4" />
        Cetak Label
      </Button>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cetak Label Barcode</DialogTitle>
          <DialogDescription>
            Label {LABEL_WIDTH_MM} x {LABEL_HEIGHT_MM} mm berisi harga, barcode
            Code 128, dan SKU.
          </DialogDescription>
        </DialogHeader>

        {isLoadingVariantLabel ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Memuat data varian...
          </p>
        ) : variantLabelError || !variantLabelData ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {variantLabelError?.message ?? "Data varian tidak ditemukan"}
          </p>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/40 p-3 text-sm">
              <p className="font-medium">
                {variantLabelData.productName}
                {variantLabelData.variantLabel &&
                  ` — ${variantLabelData.variantLabel}`}
              </p>
              <div className="mt-1 flex justify-between text-muted-foreground">
                <span className="font-mono">{variantLabelData.sku}</span>
                <span>{toIDR(variantLabelData.price)}</span>
              </div>
            </div>

            <Field>
              <FieldLabel>Stok di toko</FieldLabel>
              <Select
                value={selectedStore?.storeId ?? ""}
                onValueChange={(value) => {
                  setStoreId(value);
                  // Ganti toko → jumlah kembali mengikuti stok toko itu.
                  setQuantityInput(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih toko" />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((store) => (
                    <SelectItem key={store.storeId} value={store.storeId}>
                      {store.storeName} — stok {store.stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel>Jumlah label</FieldLabel>
              <Input
                inputMode="numeric"
                value={quantityText}
                onChange={(event) => setQuantityInput(event.target.value)}
              />
              {quantityError ? (
                <FieldError>{quantityError}</FieldError>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {storeStock > 0
                    ? `Default mengikuti stok di ${selectedStore?.storeName} (${storeStock}).`
                    : `Stok di ${selectedStore?.storeName ?? "toko ini"} 0 — default 1 label.`}
                </p>
              )}
            </Field>

            {/* Peringatan, bukan penolakan: resolusi printer yang sebenarnya
                tidak diketahui aplikasi. Printer 300 dpi mungkin masih bisa. */}
            {isBarcodeTooDense && (
              <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <span>
                  SKU ini cukup panjang untuk label {LABEL_WIDTH_MM} mm — batang
                  barcode hanya ±{moduleWidthMm!.toFixed(2)} mm dan bisa sulit
                  terbaca di printer 203 dpi. Coba cetak 1 label dulu untuk
                  diuji dengan scanner.
                </span>
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Pastikan ukuran kertas di pengaturan printer thermal diset{" "}
              {LABEL_WIDTH_MM} x {LABEL_HEIGHT_MM} mm dengan margin 0.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handlePrint}
            disabled={!variantLabelData || !!quantityError}
          >
            <Printer className="size-4" />
            Cetak {quantityError ? "" : `${quantity} Label`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
