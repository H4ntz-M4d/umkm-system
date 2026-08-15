"use client";

import { useState } from "react";
import { FileSpreadsheet, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadFile } from "@/lib/api/api.blob";

interface ExportButtonsProps {
  /// Path endpoint ekspor beserta filter yang sedang aktif, tanpa paginasi.
  excelPath: string;
  /// Nama berkas cadangan bila backend tidak mengirim Content-Disposition.
  fallbackName: string;
  /// Rute cetak; kalau kosong, tombol cetak tidak ditampilkan.
  printPath?: string;
}

/**
 * Tombol ekspor yang dipakai bersama di halaman laporan dan halaman tabel.
 *
 * Excel diambil dari server, bukan dirakit di browser, karena tabel-tabel di
 * aplikasi ini berpaginasi — merakitnya di sisi klien hanya akan mengekspor
 * baris yang kebetulan sedang tampil.
 */
export default function ExportButtons({
  excelPath,
  fallbackName,
  printPath,
}: ExportButtonsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleExcel = async () => {
    setIsDownloading(true);
    try {
      await downloadFile(excelPath, fallbackName);
    } catch {
      toast.error("Gagal mengunduh berkas Excel", { position: "top-center" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex gap-2 print:hidden">
      {printPath && (
        <Button variant="outline" asChild>
          <a href={printPath} target="_blank" rel="noopener noreferrer">
            <Printer className="size-4" />
            Cetak PDF
          </a>
        </Button>
      )}
      <Button onClick={handleExcel} disabled={isDownloading}>
        <FileSpreadsheet className="size-4" />
        {isDownloading ? "Menyiapkan..." : "Excel"}
      </Button>
    </div>
  );
}
