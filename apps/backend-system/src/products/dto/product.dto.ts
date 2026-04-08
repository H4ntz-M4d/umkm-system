import { createZodDto } from 'nestjs-zod';
import { ProductSchema, UpdateProductSchema } from '@repo/schemas';

export class CreateProductDto extends createZodDto(ProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
