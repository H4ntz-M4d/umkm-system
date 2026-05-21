import { Module } from '@nestjs/common';
import { PosTransactionService } from './pos-transaction/pos-transaction.service';
import { PosTransactionController } from './pos-transaction/pos-transaction.controller';

@Module({
  providers: [PosTransactionService],
  controllers: [PosTransactionController],
})
export class PosTransactionModule {}
