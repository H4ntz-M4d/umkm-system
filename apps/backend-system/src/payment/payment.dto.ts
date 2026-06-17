import { PaymentMethodSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class PaymentMethodDto extends createZodDto(PaymentMethodSchema) {}
