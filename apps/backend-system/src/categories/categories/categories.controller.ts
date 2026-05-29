import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesDto } from 'categories/dto/categories.dto';

@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Query('search') search?: string) {
    return this.categoriesService.findAll(search);
  }

  @Get('/list')
  listCategories() {
    return this.categoriesService.getListCategories();
  }

  @Get('/summary')
  categoriesSummary() {
    return this.categoriesService.getCategoriesSummary();
  }

  @Post()
  create(@Body() data: CategoriesDto) {
    return this.categoriesService.create(data);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.categoriesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: bigint, @Body() data: CategoriesDto) {
    return this.categoriesService.update(id, data);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: bigint) {
    return this.categoriesService.delete(id);
  }
}
