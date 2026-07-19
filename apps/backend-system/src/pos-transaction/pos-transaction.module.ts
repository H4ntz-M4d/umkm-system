import { Module } from '@nestjs/common';
import { PosTransactionService } from './pos-transaction/pos-transaction.service';
import { PosTransactionController } from './pos-transaction/pos-transaction.controller';
import { CloudinaryService } from 'cloudinary/cloudinary.service';
import { MidtransService } from 'midtrans/midtrans.service';

@Module({
  providers: [PosTransactionService, CloudinaryService, MidtransService],
  controllers: [PosTransactionController],
})
export class PosTransactionModule {}
