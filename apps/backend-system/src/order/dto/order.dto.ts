import {
  CheckoutSchema,
  MyOrderQuerySchema,
  OrderQuerySchema,
  SubmitOrderSchema,
  UpdateOrderNegotiationSchema,
  UpdateShipmentSchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}
/// Alur bayar online lama — dinonaktifkan, tidak dihapus.
export class CheckoutDto extends createZodDto(CheckoutSchema) {}
export class SubmitOrderDto extends createZodDto(SubmitOrderSchema) {}
export class UpdateOrderNegotiationDto extends createZodDto(
  UpdateOrderNegotiationSchema,
) {}
export class MyOrderQueryDto extends createZodDto(MyOrderQuerySchema) {}
export class UpdateShipmentDto extends createZodDto(UpdateShipmentSchema) {}
