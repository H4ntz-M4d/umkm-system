import { Injectable } from '@nestjs/common';
import type { ReportsQueryInput } from '@repo/schemas';
import { ReportsService } from './reports.service';
import { buildWorkbook, SheetSpec } from 'common/helpers/excel';
import { resolveReportRange } from './reports.revenue';

/**
 * Menyusun berkas Excel dari data laporan yang sama persis dengan yang tampil
 * di layar — memanggil `ReportsService`, bukan menulis ulang query-nya, supaya
 * angka di berkas tidak mungkin berbeda dari angka di halaman.
 *
 * Semua laporan masuk ke satu berkas dengan beberapa sheet, karena yang dibawa
 * keluar adalah "laporan periode ini" sebagai satu dokumen, bukan potongan
 * terpisah yang harus disatukan lagi oleh penerimanya.
 */
@Injectable()
export class ReportsExportService {
  constructor(private reportsService: ReportsService) {}

  async buildReportsWorkbook(query: ReportsQueryInput) {
    const [summary, revenueExpense, expenseCategory, topProducts, payments] =
      await Promise.all([
        this.reportsService.summary(query),
        this.reportsService.revenueVsExpense(query),
        this.reportsService.expenseByCategory(query),
        this.reportsService.topProducts({ ...query, limit: 50 }),
        this.reportsService.paymentMethods(query),
      ]);

    const s = summary.data;

    const sheets: SheetSpec[] = [
      {
        name: 'Ringkasan',
        columns: [
          { header: 'Keterangan', key: 'label', width: 34 },
          { header: 'Periode ini', key: 'current', money: true, width: 18 },
          { header: 'Periode sebelumnya', key: 'previous', money: true, width: 20 },
        ],
        rows: [
          { label: `Periode: ${s.range.dateFrom} s/d ${s.range.dateTo}` },
          {
            label: `Pembanding: ${s.previousRange.dateFrom} s/d ${s.previousRange.dateTo}`,
          },
          {},
          {
            label: 'Pemasukan kasir',
            current: s.revenuePos.current,
            previous: s.revenuePos.previous,
          },
          {
            label: 'Pemasukan online',
            current: s.revenueOnline.current,
            previous: s.revenueOnline.previous,
          },
          {
            label: 'Total pemasukan',
            current: s.revenue.current,
            previous: s.revenue.previous,
          },
          {
            label: 'Pengeluaran',
            current: s.expense.current,
            previous: s.expense.previous,
          },
          {
            label: 'Selisih',
            current: s.balance.current,
            previous: s.balance.previous,
          },
          {},
          {
            label:
              'Pemasukan dihitung dari transaksi lunas dan tidak termasuk ongkos kirim.',
          },
        ],
      },
      {
        name: 'Pemasukan vs Pengeluaran',
        columns: [
          { header: 'Bulan', key: 'period', width: 12 },
          { header: 'Kasir', key: 'revenuePos', money: true },
          { header: 'Online', key: 'revenueOnline', money: true },
          { header: 'Total pemasukan', key: 'revenue', money: true },
          { header: 'Pengeluaran', key: 'expense', money: true },
          { header: 'Selisih', key: 'balance', money: true },
        ],
        rows: revenueExpense.data.map((item) => ({
          period: item.period,
          revenuePos: item.revenuePos,
          revenueOnline: item.revenueOnline,
          revenue: item.revenue,
          expense: item.expense,
          balance: String(Number(item.revenue) - Number(item.expense)),
        })),
      },
      {
        name: 'Pengeluaran per Kategori',
        columns: [
          { header: 'Kategori', key: 'categoryName', width: 28 },
          { header: 'Total', key: 'total', money: true },
        ],
        rows: expenseCategory.data.map((item) => ({
          categoryName: item.categoryName,
          total: item.total,
        })),
      },
      {
        name: 'Produk Terlaris',
        columns: [
          { header: 'Produk', key: 'productName', width: 32 },
          { header: 'Varian', key: 'variantLabel', width: 20 },
          { header: 'SKU', key: 'sku', width: 18 },
          { header: 'Qty kasir', key: 'quantityPos' },
          { header: 'Qty online', key: 'quantityOnline' },
          { header: 'Qty total', key: 'quantityTotal' },
          { header: 'Nilai', key: 'revenueTotal', money: true },
        ],
        rows: topProducts.data.map((item) => ({
          productName: item.productName,
          variantLabel: item.variantLabel,
          sku: item.sku,
          quantityPos: item.quantityPos,
          quantityOnline: item.quantityOnline,
          quantityTotal: item.quantityTotal,
          revenueTotal: item.revenueTotal,
        })),
      },
      {
        name: 'Metode Pembayaran',
        columns: [
          { header: 'Metode', key: 'paymentMethodName', width: 24 },
          { header: 'Jumlah transaksi', key: 'transactionCount', width: 18 },
          { header: 'Nilai', key: 'total', money: true },
        ],
        rows: payments.data.map((item) => ({
          paymentMethodName: item.paymentMethodName,
          transactionCount: item.transactionCount,
          total: item.total,
        })),
      },
    ];

    const range = resolveReportRange(query);

    return {
      buffer: await buildWorkbook(sheets),
      filename: `laporan-${range.dateFrom}-sd-${range.dateTo}`,
    };
  }
}
