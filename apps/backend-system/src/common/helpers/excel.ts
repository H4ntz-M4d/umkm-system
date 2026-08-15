import { Workbook } from 'exceljs';
import type { Response } from 'express';

/**
 * Pembangun berkas Excel bersama untuk seluruh ekspor.
 *
 * Dua hal yang dijaga di sini dan mudah salah kalau tiap modul menulis sendiri:
 *
 * 1. **Angka ditulis sebagai angka, bukan teks yang sudah diformat.** Kalau
 *    dikirim sebagai "Rp 1.200.000", penerimanya tidak bisa menjumlahkan atau
 *    membuat pivot — berkasnya jadi gambar tabel, bukan data. Formatnya diatur
 *    lewat `numFmt`, isinya tetap numerik.
 * 2. **Respons tidak boleh dibungkus interceptor.** `ResponseInterceptor`
 *    global membungkus semua nilai balik controller menjadi JSON, jadi endpoint
 *    ekspor wajib memakai `@Res()` tanpa `passthrough` dan menulis sendiri lewat
 *    `sendWorkbook`.
 */

const MONEY_FORMAT = '#,##0';
const HEADER_FILL = 'FFF0ECE6';

export interface SheetColumn {
  header: string;
  key: string;
  width?: number;
  /// Diformat sebagai angka ribuan; nilainya tetap numerik agar bisa dihitung.
  money?: boolean;
}

export interface SheetSpec {
  name: string;
  columns: SheetColumn[];
  rows: Record<string, string | number | null | undefined>[];
}

export async function buildWorkbook(sheets: SheetSpec[]): Promise<Buffer> {
  const workbook = new Workbook();
  workbook.creator = 'Nurfa Craft System';
  workbook.created = new Date();

  for (const sheet of sheets) {
    /// Nama sheet Excel dibatasi 31 karakter dan menolak beberapa tanda baca.
    const worksheet = workbook.addWorksheet(
      sheet.name.replace(/[*?:\\/[\]]/g, '').slice(0, 31),
    );

    worksheet.columns = sheet.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? Math.max(14, column.header.length + 4),
    }));

    for (const row of sheet.rows) {
      const added = worksheet.addRow(row);

      sheet.columns.forEach((column, index) => {
        if (!column.money) return;

        /// Baris yang memang tidak membawa kolom ini — misalnya baris judul
        /// periode atau catatan kaki — dibiarkan kosong. Menuliskannya sebagai
        /// nol membuat berkas penuh angka semu yang bisa ikut terjumlah.
        if (!(column.key in row)) return;

        const cell = added.getCell(index + 1);
        const value = row[column.key];
        cell.value = value === null || value === undefined ? 0 : Number(value);
        cell.numFmt = MONEY_FORMAT;
      });
    }

    const header = worksheet.getRow(1);
    header.font = { bold: true };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    };
    /// Judul kolom tetap terlihat saat digulir — berkas laporan biasanya panjang.
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/// Nama berkas selalu membawa rentang tanggalnya kalau ada, supaya beberapa
/// hasil unduhan tidak berakhir sebagai "pengeluaran (1).xlsx" di folder unduhan.
export function buildExportFilename(
  base: string,
  dateFrom?: string,
  dateTo?: string,
) {
  if (dateFrom && dateTo) return `${base}-${dateFrom}-sd-${dateTo}`;
  if (dateFrom) return `${base}-sejak-${dateFrom}`;

  return `${base}-${new Date().toISOString().slice(0, 10)}`;
}

export function sendWorkbook(res: Response, buffer: Buffer, filename: string) {
  res.set({
    'Content-Type':
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
    'Content-Length': String(buffer.length),
  });
  res.end(buffer);
}
