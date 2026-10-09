import {
  DashboardExpenseByCategoryQuerySchema,
  DashboardScopeQuerySchema,
  DashboardTrendQuerySchema,
} from '@repo/schemas';
import { createZodDto } from 'nestjs-zod';

export class DashboardTrendQueryDto extends createZodDto(
  DashboardTrendQuerySchema,
) {}

export class DashboardExpenseByCategoryQueryDto extends createZodDto(
  DashboardExpenseByCategoryQuerySchema,
) {}

export class DashboardScopeQueryDto extends createZodDto(
  DashboardScopeQuerySchema,
) {}
