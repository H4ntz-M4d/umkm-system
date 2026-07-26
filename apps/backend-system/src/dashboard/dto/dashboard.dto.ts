import {
  DashboardExpenseByCategoryQuerySchema,
  DashboardTrendQuerySchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class DashboardTrendQueryDto extends createZodDto(
  DashboardTrendQuerySchema,
) {}

export class DashboardExpenseByCategoryQueryDto extends createZodDto(
  DashboardExpenseByCategoryQuerySchema,
) {}
