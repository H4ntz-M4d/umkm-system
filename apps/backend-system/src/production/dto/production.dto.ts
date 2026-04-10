import { createZodDto } from 'nestjs-zod';
import {
  ProductionSchema,
  UpdateProductionMaterialSchema,
  UpdateProductionSchema,
} from '@repo/schemas';

export class CreateProductionDto extends createZodDto(ProductionSchema) {}
export class UpdateProductionDto extends createZodDto(UpdateProductionSchema) {}
export class UpdateProductionMaterialDto extends createZodDto(
  UpdateProductionMaterialSchema,
) {}
