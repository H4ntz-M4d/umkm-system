import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@repo/db';
import { StockTransferService } from './stock-transfer.service';
import {
  CreateStockTransferDto,
  StockTransferQueryDto,
} from './dto/stock-transfer.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { CentralStoreOnly } from 'common/decorator/central-store.decorator';
import { CentralStoreGuard } from 'common/guards/guard.central-store';

/**
 * Distribusi stok dari rumah produksi ke cabang.
 *
 * Gudang ikut diizinkan karena merekalah yang secara fisik mengemas dan
 * menerima barang. Kasir dikecualikan: menerima kiriman berarti menambah stok,
 * dan itu kewenangan yang berbeda dari melayani penjualan.
 */
@UseGuards(JwtAuthGuard, RolesGuard, CentralStoreGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
@Controller('api/v1/stock-transfers')
export class StockTransferController {
  constructor(private stockTransferService: StockTransferService) {}

  @Get()
  findAll(@Query() query: StockTransferQueryDto) {
    return this.stockTransferService.findAll(query);
  }

  @CentralStoreOnly()
  @Post()
  create(@Body() data: CreateStockTransferDto, @AuthUser() user: JwtPayload) {
    return this.stockTransferService.create(data, user);
  }

  @CentralStoreOnly()
  @Patch(':id/send')
  send(@Param('id', ParseIntPipe) id: bigint) {
    return this.stockTransferService.send(id);
  }

  /**
   * Sengaja TIDAK dibatasi ke pusat.
   *
   * Yang memastikan barang benar-benar sampai adalah orang di toko tujuan —
   * dan toko tujuan justru selalu bukan pusat. Membatasinya ke pusat berarti
   * kiriman tidak akan pernah bisa diterima siapa pun.
   */
  @Patch(':id/receive')
  receive(@Param('id', ParseIntPipe) id: bigint) {
    return this.stockTransferService.receive(id);
  }

  /// Pembatalan hanya untuk kiriman yang belum berangkat, jadi tidak pernah
  /// membalikkan stok — karena itu tidak perlu dibatasi lebih ketat dari yang lain.
  @CentralStoreOnly()
  @Patch(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: bigint) {
    return this.stockTransferService.cancel(id);
  }
}
