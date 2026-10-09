import { Module } from '@nestjs/common';
import { PaymentService } from './payment/payment.service';
import { PaymentController } from './payment/payment.controller';
import { CloudinaryModule } from 'cloudinary/cloudinary.module';

@Module({
  /// Dibutuhkan untuk mengunggah gambar QRIS tercetak.
  imports: [CloudinaryModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
