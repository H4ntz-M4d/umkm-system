import { Module } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { ProductImageGroupService } from './products/product-image-group.service';
import { PublicProductsService } from './products/public-products.service';
import { PublicProductsController } from './products/public-products.controller';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';
import { CategoriesModule } from 'categories/categories.module';

@Module({
  imports: [CloudinaryModule, CategoriesModule],
  providers: [ProductsService, ProductImageGroupService, PublicProductsService],
  controllers: [ProductsController, PublicProductsController],
})
export class ProductsModule {}
