import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { sendWorkbook } from 'common/helpers/excel';
import { InventoryLedgerService } from './inventory-ledger.service';
import { Pagination } from 'common/paginate/pagination';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
@Controller('api/v1/inventory-ledger')
export class InventoryLedgerController {
  constructor(private ledgerService: InventoryLedgerService) {}

  @Get()
  findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('itemType') itemType?: string,
    @Query('direction') direction?: string,
    @Query('source') source?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.ledgerService.findAll(pagination, {
      search,
      itemType,
      direction,
      source,
      dateFrom,
      dateTo,
    });
  }

  @Get('/summary')
  getSummary() {
    return this.ledgerService.getSummary();
  }

  /**
   * Melayani halaman stok rendah sekaligus kartu ringkasnya di dashboard —
   * kartu itu cukup memakai `limit` kecil lalu membaca `meta.total`.
   *
   * Kasir ikut diizinkan meski tidak boleh membuka halaman Stok Rendah, karena
   * kartu di dashboard memang ditujukan untuk semua role manajemen. Yang
   * dibatasi hanyalah halamannya, bukan datanya.
   */
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG, UserRole.KASIR)
  @Get('/low-stock')
  findLowStock(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.ledgerService.findLowStock(pagination, search, storeId);
  }

  @Get('/low-stock/export')
  async exportLowStock(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('storeId') storeId?: string,
  ) {
    const { buffer, filename } =
      await this.ledgerService.exportLowStockWorkbook(search, storeId);

    sendWorkbook(res, buffer, filename);
  }
}
