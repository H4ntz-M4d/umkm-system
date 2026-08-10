import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TransactionFlowService } from './transaction-flow.service';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/transaction-flow')
export class TransactionFlowController {
  constructor(private transactionFlowService: TransactionFlowService) {}

  @Get()
  findAll(
    @Query('store') store: string,
    @Query('type') type: string,
    @Query('source') source: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.transactionFlowService.findAll({
      storeId: store,
      type,
      source,
      skip: page,
      take: limit,
    });
  }

  @Get('/summary')
  summaryTransaction() {
    return this.transactionFlowService.summaryTransaction();
  }

  /// Ikut tampil sebagai kartu ringkasan di halaman pesanan, yang juga diakses
  /// Kasir — karena itu rolenya lebih luas dari endpoint lain di controller ini.
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get('/summary-amount-pos-and-order-transaction')
  summaryPosAndOrderTransaction() {
    return this.transactionFlowService.summaryAmountPosAndOrderTransaction();
  }
}
