import { ExpenseSchema, UpdateExpenseSchema } from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class ExpenseDto extends createZodDto(ExpenseSchema) {}
export class UpdateExpenseDto extends createZodDto(UpdateExpenseSchema) {}
