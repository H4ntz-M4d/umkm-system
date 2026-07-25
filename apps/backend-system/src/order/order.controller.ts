import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderQueryDto } from 'order/dto/order.dto';

@Controller('api/v1/orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  @Patch('/cancelled')
  cancel(@Body() orderId: string[]) {
    return this.orderService.cancel(orderId);
  }
}
