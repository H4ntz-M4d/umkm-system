import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentMethodDto } from 'payment/payment.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
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
