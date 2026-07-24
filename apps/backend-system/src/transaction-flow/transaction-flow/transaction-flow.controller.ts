import { Controller, Get, ParseIntPipe, Query } from '@nestjs/common';
import { TransactionFlowService } from './transaction-flow.service';

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
}
