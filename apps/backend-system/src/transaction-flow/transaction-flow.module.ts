import { Module } from '@nestjs/common';
import { TransactionFlowService } from './transaction-flow/transaction-flow.service';
import { TransactionFlowController } from './transaction-flow/transaction-flow.controller';
import { PosTransactionModule } from 'pos-transaction/pos-transaction.module';
import { OrderModule } from 'order/order.module';

@Module({
  imports: [PosTransactionModule, OrderModule],
  providers: [TransactionFlowService],
  controllers: [TransactionFlowController],
})
export class TransactionFlowModule {}
