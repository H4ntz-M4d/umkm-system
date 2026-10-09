import { toIDR } from "../../../../../utils/format-money";
import {
  LABEL_HEIGHT_MM,
  LABEL_PADDING_MM,
  LABEL_WIDTH_MM,
} from "./label-config";

interface BarcodeLabelProps {
  /// Markup SVG dari renderCode128 — dibuat sekali, dipakai semua label.
  svg: string;
  sku: string;
  price: string;
}

/**
 * Satu stiker label: harga, barcode, dan SKU.
 *
 * Ukurannya ditulis dalam milimeter lewat inline style, bukan kelas Tailwind,
 * supaya tetap mengikuti `label-config.ts` sebagai satu-satunya sumber ukuran.
 * SKU dicetak sebagai teks di bawah barcode sebagai cadangan kalau barcodenya
 * rusak dan harus diketik manual.
 */
export function BarcodeLabel({ svg, sku, price }: BarcodeLabelProps) {
  return (
    <div
      className="barcode-label flex flex-col items-stretch justify-between overflow-hidden bg-white text-black"
      style={{
        width: `${LABEL_WIDTH_MM}mm`,
        height: `${LABEL_HEIGHT_MM}mm`,
        padding: `${LABEL_PADDING_MM}mm`,
      }}
    >
      <p
        className="text-center font-bold leading-none"
        style={{ fontSize: "10pt" }}
      >
        {toIDR(price)}
      </p>

      <div
        className="[&>svg]:block [&>svg]:h-full [&>svg]:w-full"
        style={{ height: "15mm" }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p
        className="text-center font-mono leading-none tracking-wide"
        style={{ fontSize: "8pt" }}
      >
        {sku}
      </p>
    </div>
  );
}
