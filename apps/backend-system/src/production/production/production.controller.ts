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
import { sendWorkbook } from 'common/helpers/excel';
import { ProductionService } from 'production/production/production.service';
import { Pagination } from 'common/paginate/pagination';
import {
  CreateProductionBeSpokeDto,
  UpdateProductionDto,
} from 'production/dto/production.dto';
import { ProductionStatus, ProductionType, UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
@Controller('api/v1/production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get()
  findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('type') type?: ProductionType,
    @Query('status') status?: ProductionStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.productionService.findAll(
      pagination,
      search,
      type,
      status,
      dateFrom,
      dateTo,
    );
  }

  @Get('/summary')
  productionSummary() {
    return this.productionService.productionSummary();
  }

  /// Didaftarkan sebelum `@Get(':id')` agar "/export" tidak tertangkap sebagai id.
  @Get('/export')
  async exportExcel(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('type') type?: ProductionType,
    @Query('status') status?: ProductionStatus,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { buffer, filename } = await this.productionService.exportWorkbook(
      search,
      type,
      status,
      dateFrom,
      dateTo,
    );

    sendWorkbook(res, buffer, filename);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.findById(id);
  }

  @Post()
  create(@Body() data: CreateProductionBeSpokeDto) {
    return this.productionService.create(data);
  }

  @Put(':id/edit')
  updateProduction(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: CreateProductionBeSpokeDto,
  ) {
    return this.productionService.updateProduction(id, data);
  }

  @Patch(':id/status-update')
  updateProductionStatus(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateProductionDto,
  ) {
    return this.productionService.updateStatusNotCompleted(id, data);
  }

  @Post(':id/status-completed')
  updateProductionStatusCompleted(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateProductionDto,
  ) {
    return this.productionService.updateStatusCompleted(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.remove(id);
  }
}
