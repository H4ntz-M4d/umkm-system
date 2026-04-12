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
  UploadedFile,
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

@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
  ) {
    return await this.productsService.findAll(pagination, search);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('/list')
  async findProductVariant() {
    return this.productsService.findProductVariantsList();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get(':id/details')
  async findById(@Param('id') id: string) {
    return await this.productsService.productById(BigInt(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post()
  async create(@Body() data: CreateProductDto) {
    return await this.productsService.create(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: CreateProductDto,
  ) {
    return await this.productsService.update(id, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: bigint) {
    return await this.productsService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Patch('/:id/upload')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @Param('id') productId: string,
    @Body('variantIds') variantIds: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    validateImageFiles(files, 10);
    const ids: string[] = JSON.parse(variantIds) as string[];
    return await this.productsService.uploadImages(ids, files);
  }
}
