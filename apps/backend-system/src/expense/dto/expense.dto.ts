import { ExpenseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ExpenseDto extends createZodDto(ExpenseSchema) {}
