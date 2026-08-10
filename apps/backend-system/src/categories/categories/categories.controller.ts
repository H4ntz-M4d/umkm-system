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
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesDto } from 'categories/dto/categories.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

/**
 * Role dipasang per-method, bukan di level class: Kasir hanya butuh membaca
 * kategori untuk memfilter produk di POS, sementara pengelolaan datanya
 * (tambah/ubah/hapus) milik Owner, Admin, dan Gudang.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get()
  findAll(@Query('search') search?: string) {
    return this.categoriesService.findAll(search);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get('/list')
  listCategories() {
    return this.categoriesService.getListCategories();
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get('/summary')
  categoriesSummary() {
    return this.categoriesService.getCategoriesSummary();
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Post()
  create(@Body() data: CategoriesDto) {
    return this.categoriesService.create(data);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.categoriesService.findOne(id);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: bigint, @Body() data: CategoriesDto) {
    return this.categoriesService.update(id, data);
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: bigint) {
    return this.categoriesService.delete(id);
  }
}
