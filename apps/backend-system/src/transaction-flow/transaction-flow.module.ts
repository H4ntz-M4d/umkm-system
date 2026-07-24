import { Module } from '@nestjs/common';
import { TransactionFlowService } from './transaction-flow/transaction-flow.service';
import { TransactionFlowController } from './transaction-flow/transaction-flow.controller';

@Module({
  providers: [TransactionFlowService],
  controllers: [TransactionFlowController]
})
export class TransactionFlowModule {}
