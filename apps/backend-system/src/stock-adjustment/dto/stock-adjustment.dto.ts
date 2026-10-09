import {
  StockAdjustmentQuerySchema,
  StockAdjustmentSchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class StockAdjustmentDto extends createZodDto(StockAdjustmentSchema) {}
export class StockAdjustmentQueryDto extends createZodDto(
  StockAdjustmentQuerySchema,
) {}
