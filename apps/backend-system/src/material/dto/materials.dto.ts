import { createZodDto } from 'nestjs-zod';
import { MaterialsSchema, UpdateMaterialsSchema } from '@repo/schemas';

export class CreateMaterialsDto extends createZodDto(MaterialsSchema) {}
export class UpdateMaterialsDto extends createZodDto(UpdateMaterialsSchema) {}
