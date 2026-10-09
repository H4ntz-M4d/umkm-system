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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@repo/db';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { Roles } from 'common/decorator/roles.decorator';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { IMAGE_VALIDATOR } from 'common/interceptors/upload-image.interceptors';
import { BlogCategoryDto, BlogDto, BlogQueryDto } from 'blog/dto/blog.dto';
import { CentralStoreOnly } from 'common/decorator/central-store.decorator';
import { CentralStoreGuard } from 'common/guards/guard.central-store';
import { BlogService } from './blog.service';

/// Kelola blog: Owner dan Admin. Tulisannya tampil atas nama toko, jadi
/// bukan pekerjaan kasir atau gudang.
@UseGuards(JwtAuthGuard, RolesGuard, CentralStoreGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
/**
 * Seluruh pengelolaan blog milik pusat, termasuk membacanya.
 *
 * Blog tampil di storefront atas nama Nurfa Craft secara keseluruhan — bukan
 * milik satu cabang. Cabang tidak perlu melihat draf yang belum terbit, dan
 * tidak berkepentingan mengubah tulisan yang mewakili seluruh usaha.
 */
@CentralStoreOnly()
@Controller('api/v1/blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  /// Rute tetap didaftarkan sebelum rute berparameter, supaya "categories"
  /// dan "cover" tidak tertangkap sebagai sebuah id.
  @Get('/categories')
  findCategories() {
    return this.blogService.findCategories();
  }

  @Post('/categories')
  createCategory(@Body() data: BlogCategoryDto) {
    return this.blogService.createCategory(data);
  }

  @Delete('/categories/:id')
  removeCategory(@Param('id', ParseIntPipe) id: bigint) {
    return this.blogService.removeCategory(BigInt(id));
  }

  @Post('/cover')
  @UseInterceptors(FileInterceptor('image'))
  uploadCover(@UploadedFile(IMAGE_VALIDATOR(true)) file: Express.Multer.File) {
    return this.blogService.uploadCover(file);
  }

  @Get()
  findAll(@Query() query: BlogQueryDto) {
    return this.blogService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.blogService.findOne(BigInt(id));
  }

  @Post()
  create(@Body() data: BlogDto, @AuthUser() user: JwtPayload) {
    return this.blogService.create(data, user);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: bigint, @Body() data: BlogDto) {
    return this.blogService.update(BigInt(id), data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.blogService.remove(BigInt(id));
  }
}
