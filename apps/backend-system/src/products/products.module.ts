import { Module } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { ProductImageGroupService } from './products/product-image-group.service';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  providers: [ProductsService, ProductImageGroupService],
  controllers: [ProductsController],
})
export class ProductsModule {}
