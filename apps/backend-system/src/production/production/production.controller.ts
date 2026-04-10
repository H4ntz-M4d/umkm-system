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
  CreateProductionDto,
  UpdateProductionDto,
  UpdateProductionMaterialDto,
} from 'production/dto/production.dto';

@Controller('api/v1/production')
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  @Get()
  findAll(@Query() pagination: Pagination, @Query('search') search?: string) {
    return this.productionService.findAll(pagination, search);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.findById(id);
  }

  @Post()
  create(@Body() data: CreateProductionDto) {
    return this.productionService.create(data);
  }

  @Patch(':id/production/edit')
  updateProduction(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateProductionDto,
  ) {
    return this.productionService.updateProduction(id, data);
  }

  @Patch(':id/product-material/edit')
  updateProductionMaterial(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateProductionMaterialDto,
  ) {
    return this.productionService.updateProductionMaterial(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.productionService.remove(id);
  }
}
