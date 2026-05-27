import { CategoriesSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class CategoriesDto extends createZodDto(CategoriesSchema) {}
