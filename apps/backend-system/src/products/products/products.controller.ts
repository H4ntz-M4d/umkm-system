import {
  BadRequestException,
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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Pagination } from 'common/paginate/pagination';
import { ProductsService } from 'products/products/products.service';
import { CreateProductDto } from 'products/dto/product.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { FilesInterceptor } from '@nestjs/platform-express';
import { validateImageFiles } from 'common/interceptors/upload-image.interceptors';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { resolveTransactionStore } from 'common/helpers/resolve-store';

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
  ) {
    return await this.productsService.findAll(pagination, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Get('/list')
  async findProductVariant() {
    return this.productsService.findProductVariantsList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Get(':id/details')
  async findById(@Param('id') id: string) {
    return await this.productsService.productById(BigInt(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  /// Toko ditentukan dari token kasir, sama seperti saat menyimpan transaksi —
  /// supaya yang terlihat dan yang terjual selalu berasal dari toko yang sama.
  @Get('/point-of-sales/list')
  async getProductList(
    @AuthUser() user: JwtPayload,
    @Query('storeId') storeId?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const resolvedStoreId = await resolveTransactionStore(user, storeId);

    return await this.productsService.getProductList(
      resolvedStoreId,
      search,
      categoryId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Post()
  async create(@Body() data: CreateProductDto) {
    return await this.productsService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: CreateProductDto,
  ) {
    return await this.productsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: bigint) {
    return await this.productsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Patch('/:id/upload')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @Param('id') productId: string,
    @Body('imageGroupIds') rawGroupIds: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    validateImageFiles(files, 10);

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawGroupIds ?? '[]');
    } catch {
      throw new BadRequestException('Format imageGroupIds tidak valid');
    }

    if (
      !Array.isArray(parsed) ||
      parsed.some((id) => typeof id !== 'string' || !/^\d+$/.test(id))
    ) {
      throw new BadRequestException(
        'imageGroupIds harus berupa array berisi id bertipe string',
      );
    }

    return await this.productsService.uploadGroupImages(
      BigInt(productId),
      parsed as string[],
      files,
    );
  }
}
