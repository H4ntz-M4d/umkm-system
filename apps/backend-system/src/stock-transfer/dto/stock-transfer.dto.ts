import { createZodDto } from 'nestjs-zod';
import {
  CreateStockTransferSchema,
  StockTransferQuerySchema,
} from '@repo/schemas';

export class CreateStockTransferDto extends createZodDto(
  CreateStockTransferSchema,
) {}

export class StockTransferQueryDto extends createZodDto(
  StockTransferQuerySchema,
) {}
