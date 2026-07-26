import { Module } from '@nestjs/common';
import { PosTransactionService } from './pos-transaction/pos-transaction.service';
import { PosTransactionController } from './pos-transaction/pos-transaction.controller';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';
import { MidtransModule } from 'midtrans/midtrans.module';

@Module({
  imports: [CloudinaryModule, MidtransModule],
  providers: [PosTransactionService],
  controllers: [PosTransactionController],
  exports: [PosTransactionService],
})
export class PosTransactionModule {}
