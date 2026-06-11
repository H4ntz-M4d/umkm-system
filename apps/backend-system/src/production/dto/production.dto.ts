import { createZodDto } from 'nestjs-zod';
import {
  ProductionBeSpokeSchema,
  ProductionSchema,
  UpdateProductionSchema,
} from '@repo/schemas';

export class CreateProductionDto extends createZodDto(ProductionSchema) {}
export class UpdateProductionDto extends createZodDto(UpdateProductionSchema) {}

export class CreateProductionBeSpokeDto extends createZodDto(
  ProductionBeSpokeSchema,
) {}
