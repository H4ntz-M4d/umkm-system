import { OrderQuerySchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}
