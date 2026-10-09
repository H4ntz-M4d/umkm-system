import JsBarcode from "jsbarcode";
import { LABEL_PADDING_MM, LABEL_WIDTH_MM } from "./label-config";

/// Ruang kosong wajib di kiri-kanan barcode Code 128 (dalam satuan modul).
/// Tanpa ini scanner sering gagal menemukan awal dan akhir barcode.
const QUIET_ZONE_MODULES = 10;

export type Code128Render = {
  /// Markup SVG siap tempel; lebar/tingginya diatur CSS pemakainya.
  svg: string;
  /// Lebar total barcode dalam modul, termasuk ruang kosong kiri-kanan.
  moduleCount: number;
};

/**
 * Membuat barcode Code 128 dari SKU sebagai markup SVG.
 *
 * Dibuat SEKALI lalu dipakai ulang untuk semua label varian yang sama — tidak
 * menggambar ulang 500 kali untuk 500 label identik.
 *
 * Hanya bisa dipanggil di browser (butuh `document`), jadi pemanggil wajib
 * menjalankannya di effect atau event handler, bukan saat render di server.
 */
export function renderCode128(sku: string): Code128Render {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "svg");

  JsBarcode(node, sku, {
    format: "CODE128",
    width: 1,
    height: 40,
    margin: QUIET_ZONE_MODULES,
    displayValue: false,
  });

  const moduleCount = Number(node.getAttribute("viewBox")?.split(" ")[2] ?? 0);

  // Ukuran piksel bawaan dibuang supaya SVG mengikuti ukuran milimeter dari
  // CSS; viewBox tetap ada, jadi perbandingan antar-batang tidak berubah.
  node.removeAttribute("width");
  node.removeAttribute("height");
  node.removeAttribute("style");
  node.setAttribute("preserveAspectRatio", "none");
  // Mencegah tepi batang dihaluskan (anti-aliasing) — di printer thermal,
  // tepi abu-abu bisa tercetak sebagai batang yang melebar.
  node.setAttribute("shape-rendering", "crispEdges");

  return { svg: node.outerHTML, moduleCount };
}

/// Perkiraan lebar satu batang tersempit saat barcode direntangkan selebar
/// area cetak label.
export function estimateModuleWidthMm(moduleCount: number): number {
  if (moduleCount <= 0) return 0;
  return (LABEL_WIDTH_MM - 2 * LABEL_PADDING_MM) / moduleCount;
}
