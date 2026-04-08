import { Module } from '@nestjs/common';
import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { CloudinaryService } from 'cloudinary/cloudinary.service';

@Module({
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController]
})
export class ProductsModule {}
