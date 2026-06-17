import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentMethodDto } from 'payment/payment.dto';

@Controller('api/v1/payment-method')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get()
  findAll() {
    return this.paymentService.findAll();
  }

  @Post()
  create(@Body() data: PaymentMethodDto) {
    return this.paymentService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: PaymentMethodDto,
  ) {
    return this.paymentService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.paymentService.remove(id);
  }
}
