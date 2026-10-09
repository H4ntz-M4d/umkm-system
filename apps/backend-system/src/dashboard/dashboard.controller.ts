import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardExpenseByCategoryQueryDto,
  DashboardScopeQueryDto,
  DashboardTrendQueryDto,
} from './dto/dashboard.dto';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR, UserRole.GUDANG)
@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('order-trend')
  orderTrend(
    @Query() query: DashboardTrendQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.dashboardService.orderTrend(query, user);
  }

  @Get('omzet-trend')
  omzetTrend(
    @Query() query: DashboardTrendQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.dashboardService.omzetTrend(query, user);
  }

  @Get('expense-by-category')
  expenseByCategory(
    @Query() query: DashboardExpenseByCategoryQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.dashboardService.expenseByCategory(query, user);
  }

  @Get('production-status')
  productionStatus(
    @Query() query: DashboardScopeQueryDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.dashboardService.productionStatus(query, user);
  }
}
