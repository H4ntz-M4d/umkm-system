import { createZodDto } from 'nestjs-zod';
import {
  CloseProductionSchema,
  ProductionQuerySchema,
  ProductionSchema,
  RecordDeliverySchema,
  UpdateProductionSchema,
} from '@repo/schemas';

export class CreateProductionDto extends createZodDto(ProductionSchema) {}
export class UpdateProductionDto extends createZodDto(UpdateProductionSchema) {}
export class RecordDeliveryDto extends createZodDto(RecordDeliverySchema) {}
export class CloseProductionDto extends createZodDto(CloseProductionSchema) {}
export class ProductionQueryDto extends createZodDto(ProductionQuerySchema) {}
