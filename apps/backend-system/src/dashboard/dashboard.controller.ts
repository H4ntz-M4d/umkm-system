import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import {
  DashboardExpenseByCategoryQueryDto,
  DashboardTrendQueryDto,
} from './dto/dashboard.dto';

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('order-trend')
  orderTrend(@Query() query: DashboardTrendQueryDto) {
    return this.dashboardService.orderTrend(query);
  }

  @Get('omzet-trend')
  omzetTrend(@Query() query: DashboardTrendQueryDto) {
    return this.dashboardService.omzetTrend(query);
  }

  @Get('expense-by-category')
  expenseByCategory(@Query() query: DashboardExpenseByCategoryQueryDto) {
    return this.dashboardService.expenseByCategory(query);
  }

  @Get('production-status')
  productionStatus() {
    return this.dashboardService.productionStatus();
  }
}
