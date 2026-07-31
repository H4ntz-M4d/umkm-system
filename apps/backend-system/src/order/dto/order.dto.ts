import {
  CheckoutSchema,
  MyOrderQuerySchema,
  OrderQuerySchema,
  UpdateShipmentSchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}
export class CheckoutDto extends createZodDto(CheckoutSchema) {}
export class MyOrderQueryDto extends createZodDto(MyOrderQuerySchema) {}
export class UpdateShipmentDto extends createZodDto(UpdateShipmentSchema) {}
