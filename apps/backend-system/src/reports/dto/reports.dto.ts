import { createZodDto } from 'nestjs-zod';
import { ReportsQuerySchema, TopProductsQuerySchema } from '@repo/schemas';

export class ReportsQueryDto extends createZodDto(ReportsQuerySchema) {}
export class TopProductsQueryDto extends createZodDto(TopProductsQuerySchema) {}
