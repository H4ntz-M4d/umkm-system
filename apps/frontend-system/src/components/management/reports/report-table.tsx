"use client";

import { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Padanan tabel untuk setiap grafik laporan.
 *
 * Sengaja sederhana dan tanpa paginasi: isinya sudah dibatasi oleh filter dan
 * top-N, dan tabel ini harus bisa dibaca utuh saat dicetak. Kolom pertama
 * dianggap label, sisanya angka — angka dirata-kanan dengan `tabular-nums`
 * supaya digitnya berbaris antar baris.
 */
export function ReportTable({
  headers,
  rows,
  emptyMessage = "Tidak ada data pada periode ini.",
}: {
  headers: string[];
  rows: ReactNode[][];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableHead
                key={header}
                className={index === 0 ? "text-left" : "text-right"}
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
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <TableCell
                    key={cellIndex}
                    className={
                      cellIndex === 0 ? "text-left" : "text-right tabular-nums"
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
  );
}
