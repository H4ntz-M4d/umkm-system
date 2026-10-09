import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserRole } from '@repo/db';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { Roles } from 'common/decorator/roles.decorator';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { sendWorkbook } from 'common/helpers/excel';
import {
  CloseProductionDto,
  CreateProductionDto,
  ProductionQueryDto,
  RecordDeliveryDto,
} from 'production/dto/production.dto';
import { ProductionService } from './production.service';
import { CentralStoreOnly } from 'common/decorator/central-store.decorator';
import { CentralStoreGuard } from 'common/guards/guard.central-store';

@UseGuards(JwtAuthGuard, RolesGuard, CentralStoreGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
@Controller('api/v1/production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}

  /// Didaftarkan sebelum rute berparameter agar "/export" dan "/summary"
  /// tidak tertangkap sebagai sebuah id.
  @Get('/export')
  async exportExcel(@Res() res: Response, @Query() query: ProductionQueryDto) {
    const { buffer, filename } =
      await this.productionService.exportWorkbook(query);

    sendWorkbook(res, buffer, filename);
  }

  @Get('/summary')
  summary() {
    return this.productionService.summary();
  }

  @Get()
  findAll(@Query() query: ProductionQueryDto) {
    return this.productionService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.findOne(BigInt(id));
  }

  @CentralStoreOnly()
  @Post()
  create(@Body() data: CreateProductionDto) {
    return this.productionService.create(data);
  }

  @CentralStoreOnly()
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: CreateProductionDto,
  ) {
    return this.productionService.update(BigInt(id), data);
  }

  /**
   * Mencatat hasil yang diantar toko produksi.
   *
   * Gudang ikut dibolehkan karena merekalah yang menerima barangnya di toko
   * utama; pencatatnya diambil dari token, bukan dari body.
   */
  @CentralStoreOnly()
  @Post(':id/deliveries')
  recordDelivery(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: RecordDeliveryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.productionService.recordDelivery(BigInt(id), data, user);
  }

  @CentralStoreOnly()
  @Delete(':id/deliveries/:deliveryId')
  cancelDelivery(
    @Param('id', ParseIntPipe) id: bigint,
    @Param('deliveryId', ParseIntPipe) deliveryId: bigint,
  ) {
    return this.productionService.cancelDelivery(
      BigInt(id),
      BigInt(deliveryId),
    );
  }

  @CentralStoreOnly()
  @Patch(':id/close')
  close(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: CloseProductionDto,
  ) {
    return this.productionService.close(BigInt(id), data);
  }

  @CentralStoreOnly()
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.remove(BigInt(id));
  }
}
