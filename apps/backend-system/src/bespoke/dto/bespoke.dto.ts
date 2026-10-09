import {
  BespokeOrderSchema,
  BespokeQuerySchema,
  UpdateBespokeStatusSchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class BespokeOrderDto extends createZodDto(BespokeOrderSchema) {}
export class UpdateBespokeStatusDto extends createZodDto(
  UpdateBespokeStatusSchema,
) {}
export class BespokeQueryDto extends createZodDto(BespokeQuerySchema) {}
