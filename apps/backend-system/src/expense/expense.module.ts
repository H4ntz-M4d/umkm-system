import { Module } from '@nestjs/common';
import { ExpenseController } from './expense/expense.controller';
import { ExpenseService } from './expense/expense.service';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [ExpenseController],
  providers: [ExpenseService],
})
export class ExpenseModule {}
