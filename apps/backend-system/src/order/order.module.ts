import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { CustomerOrderService } from './customer-order.service';
import { OrderController } from './order.controller';
import { MidtransModule } from 'midtrans/midtrans.module';

@Module({
  imports: [MidtransModule],
  providers: [OrderService, CustomerOrderService],
  controllers: [OrderController],
  // CustomerOrderService ikut diekspor karena dipakai dispatcher webhook.
  exports: [OrderService, CustomerOrderService],
})
export class OrderModule {}
