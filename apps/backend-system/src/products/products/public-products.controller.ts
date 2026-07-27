import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoriesService } from 'categories/categories/categories.service';
import { PublicProductQueryDto } from 'products/dto/public-product.dto';
import { PublicProductsService } from './public-products.service';

/**
 * Endpoint storefront. Sengaja tanpa guard — semuanya read-only dan hanya
 * mengembalikan data yang memang boleh dilihat pengunjung.
 */
@Controller('api/v1/public')
export class PublicProductsController {
  constructor(
    private readonly publicProductsService: PublicProductsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Get('products')
  async findAll(@Query() query: PublicProductQueryDto) {
    return await this.publicProductsService.findPublicProducts(query);
  }

  @Get('products/:slug')
  async findBySlug(@Param('slug') slug: string) {
    return await this.publicProductsService.findPublicProductBySlug(slug);
  }

  @Get('categories')
  async findCategories() {
    return await this.categoriesService.getListCategories();
  }
}
