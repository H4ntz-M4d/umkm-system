import { Module } from '@nestjs/common';
import { ExpenseController } from './expense/expense.controller';
import { ExpenseService } from './expense/expense.service';

@Module({
  controllers: [ExpenseController],
  providers: [ExpenseService]
})
export class ExpenseModule {}
