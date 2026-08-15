"use client";

import { ReactNode, useEffect, useRef } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Kerangka bersama untuk semua halaman cetak tabel.
 *
 * Yang dicetak adalah **seluruh baris hasil filter**, bukan halaman yang sedang
 * tampil — sama seperti ekspor Excel. Karena itu rute cetak mengambil datanya
 * sendiri dengan batas besar, bukan meneruskan paginasi dari layar.
 */
export default function PrintTablePage({
  title,
  subtitle,
  headers,
  rows,
  isLoading,
  numericFrom = 999,
}: {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: ReactNode[][];
  isLoading: boolean;
  /// Indeks kolom pertama yang berisi angka; dari sini ke kanan dirata-kanan.
  numericFrom?: number;
}) {
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (isLoading || hasPrinted.current) return;

    /// Dialog cetak dibuka setelah data siap, kalau tidak yang tercetak tabel kosong.
    hasPrinted.current = true;
    const timer = setTimeout(() => window.print(), 400);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-instrument text-3xl">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {isLoading ? "Memuat data..." : `${rows.length} baris`}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="print:hidden"
        >
          <Printer className="size-4" />
          Cetak
        </Button>
      </header>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead
                  key={header}
                  className={index >= numericFrom ? "text-right" : "text-left"}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {isLoading ? "Memuat data..." : "Tidak ada data."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <TableCell
                      key={cellIndex}
                      className={
                        cellIndex >= numericFrom
                          ? "text-right tabular-nums"
                          : "text-left"
                      }
                    >
                      {cell}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
