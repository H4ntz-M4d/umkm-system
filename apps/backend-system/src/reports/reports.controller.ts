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
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';

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

  /**
   * Mengunci laporan ke toko akun yang membukanya.
   *
   * Cabang Nurfa Craft berdiri sendiri, jadi angka toko lain bukan urusan
   * mereka. `storeId` yang dikirim layar ditimpa — bukan divalidasi — supaya
   * tidak ada jalan melihat angka toko lain lewat mengganti parameter di URL,
   * termasuk lewat tombol ekspor.
   *
   * Akun tanpa toko (Owner/Admin pusat) tidak disentuh: merekalah yang berhak
   * memilih, termasuk melihat gabungan seluruh toko.
   */
  private scoped<T extends { storeId?: string }>(
    query: T,
    user: JwtPayload,
  ): T {
    return user.storeId ? { ...query, storeId: String(user.storeId) } : query;
  }

  @Get('/summary')
  summary(@Query() query: ReportsQueryDto, @AuthUser() user: JwtPayload) {
    return this.reportsService.summary(this.scoped(query, user));
  }

  @Get('/revenue-vs-expense')
  revenueVsExpense(
    @Query() query: ReportsQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.reportsService.revenueVsExpense(this.scoped(query, user));
  }

  @Get('/expense-by-category')
  expenseByCategory(
    @Query() query: ReportsQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.reportsService.expenseByCategory(this.scoped(query, user));
  }

  @Get('/top-products')
  topProducts(
    @Query() query: TopProductsQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.reportsService.topProducts(this.scoped(query, user));
  }

  @Get('/payment-methods')
  paymentMethods(
    @Query() query: ReportsQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.reportsService.paymentMethods(this.scoped(query, user));
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
  async exportExcel(
    @Query() query: ReportsQueryDto,
    @Res() res: Response,
    @AuthUser() user: JwtPayload,
  ) {
    const { buffer, filename } =
      await this.reportsExportService.buildReportsWorkbook(
        this.scoped(query, user),
      );

    sendWorkbook(res, buffer, filename);
  }
}
