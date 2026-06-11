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
} from '@nestjs/common';
import { ProductionService } from 'production/production/production.service';
import { Pagination } from 'common/paginate/pagination';
import {
  CreateProductionBeSpokeDto,
  UpdateProductionDto,
} from 'production/dto/production.dto';
import { ProductionStatus, ProductionType } from '@repo/db';

@Controller('api/v1/production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get()
  findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('type') type?: ProductionType,
    @Query('status') status?: ProductionStatus,
  ) {
    return this.productionService.findAll(pagination, search, type, status);
  }

  @Get('/summary')
  productionSummary() {
    return this.productionService.productionSummary();
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
