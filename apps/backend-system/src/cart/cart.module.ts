import { Module } from '@nestjs/common';
import { CartService } from './cart/cart.service';
import { CartController } from './cart/cart.controller';

@Module({
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}
