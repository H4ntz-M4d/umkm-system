import { createZodDto } from 'nestjs-zod';
import { ExpenseCategorySchema } from '@repo/schemas';

export class ExpenseCategoryDto extends createZodDto(ExpenseCategorySchema) {}
