import { Module } from '@nestjs/common';
import { MidtransWebhookController } from './midtrans-webhook.controller';
import { OrderModule } from 'order/order.module';
import { PosTransactionModule } from 'pos-transaction/pos-transaction.module';

@Module({
  imports: [OrderModule, PosTransactionModule],
  controllers: [MidtransWebhookController],
})
export class WebhooksModule {}
