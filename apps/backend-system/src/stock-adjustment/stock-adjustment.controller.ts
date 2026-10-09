import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@repo/db';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { Roles } from 'common/decorator/roles.decorator';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { resolveTransactionStore } from 'common/helpers/resolve-store';
import {
  StockAdjustmentDto,
  StockAdjustmentQueryDto,
} from 'stock-adjustment/dto/stock-adjustment.dto';
import { StockAdjustmentService } from './stock-adjustment.service';

/**
 * Penyesuaian stok per toko.
 *
 * SENGAJA tidak dibatasi ke pusat: stok cabang adalah barang cabang, dan
 * merekalah yang menghitungnya. Yang dibatasi adalah cakupannya — tokonya
 * selalu diambil dari akun, bukan dari body, jadi satu toko tidak bisa
 * menyetel stok toko lain.
 *
 * Kasir dan Gudang tidak diikutkan: menyetel stok bisa menutupi barang yang
 * hilang, jadi kewenangannya dipegang Owner dan Admin. Kalau kelak Gudang
 * perlu ikut menghitung, cukup ditambahkan di sini.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/stock-adjustments')
export class StockAdjustmentController {
  constructor(private readonly service: StockAdjustmentService) {}

  @Get('/rows')
  async findRows(
    @AuthUser() user: JwtPayload,
    @Query() query: StockAdjustmentQueryDto,
  ) {
    const storeId = await resolveTransactionStore(user, query.storeId);
    return this.service.findRows(storeId, query.search);
  }

  @Post()
  async apply(@Body() data: StockAdjustmentDto, @AuthUser() user: JwtPayload) {
    /// Toko akun selalu menang atas yang dikirim body — helper yang sama
    /// dipakai POS, jadi aturannya tidak bercabang.
    const storeId = await resolveTransactionStore(user, data.storeId);
    return this.service.apply(data, storeId, user);
  }
}
