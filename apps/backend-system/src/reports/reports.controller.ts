import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@repo/db';
import { ReportsService } from './reports.service';
import { ReportsExportService } from './reports.export.service';
import { ReportsQueryDto, TopProductsQueryDto } from './dto/reports.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { sendWorkbook } from 'common/helpers/excel';

/**
 * Laporan keuangan hanya untuk Owner dan Admin — sejalan dengan halaman
 * Pengeluaran dan Alur Transaksi yang sudah dibatasi ke keduanya.
 *
 * Semua endpoint menerima `dateFrom`, `dateTo`, dan `storeId` opsional. Tanpa
 * rentang, backend memakai bulan berjalan (lihat `resolveReportRange`).
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/reports')
export class ReportsController {
  constructor(
    private reportsService: ReportsService,
    private reportsExportService: ReportsExportService,
  ) {}

  @Get('/summary')
  summary(@Query() query: ReportsQueryDto) {
    return this.reportsService.summary(query);
  }

  @Get('/revenue-vs-expense')
  revenueVsExpense(@Query() query: ReportsQueryDto) {
    return this.reportsService.revenueVsExpense(query);
  }

  @Get('/expense-by-category')
  expenseByCategory(@Query() query: ReportsQueryDto) {
    return this.reportsService.expenseByCategory(query);
  }

  @Get('/top-products')
  topProducts(@Query() query: TopProductsQueryDto) {
    return this.reportsService.topProducts(query);
  }

  @Get('/payment-methods')
  paymentMethods(@Query() query: ReportsQueryDto) {
    return this.reportsService.paymentMethods(query);
  }

  /**
   * `@Res()` sengaja tanpa `passthrough`: dengan begitu Nest menyerahkan
   * pengiriman respons ke handler ini, sehingga `ResponseInterceptor` global
   * tidak sempat membungkus berkasnya menjadi JSON.
   *
   * Tidak ada paginasi di sini — filternya sama dengan yang di layar, tapi
   * seluruh baris ikut terbawa.
   */
  @Get('/export')
  async exportExcel(@Query() query: ReportsQueryDto, @Res() res: Response) {
    const { buffer, filename } =
      await this.reportsExportService.buildReportsWorkbook(query);

    sendWorkbook(res, buffer, filename);
  }
}
