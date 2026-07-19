import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Midtrans from 'midtrans-client';
import * as crypto from 'crypto';

@Injectable()
export class MidtransService {
  private snap: Midtrans.Snap;
  private core: Midtrans.CoreApi;

  constructor(private config: ConfigService) {
    /* eslint-disable-next-line */
    const isProductionEnv = config.get('MIDTRANS_IS_PRODUCTION');
    const serverKey = config.get<string>('MIDTRANS_SERVER_KEY')!;
    const clientKey = config.get<string>('MIDTRANS_API_KEY')!;

    const isProduction = isProductionEnv === true || isProductionEnv === 'true';
    this.snap = new Midtrans.Snap({ isProduction, serverKey, clientKey });
    this.core = new Midtrans.CoreApi({ isProduction, serverKey, clientKey });
  }

  // docs -> https://docs.midtrans.com/reference/qris
  /* eslint-disable */
  async createQris(params: { transactionId: string; amount: number }) {
    const response = await this.core.charge({
      payment_type: 'qris',
      transaction_details: {
        order_id: params.transactionId,
        gross_amount: Math.round(params.amount),
      },
      qris: {
        acquirer: 'gopay',
      },
    });

    return {
      qrString: response.qr_string,
      qrUrl: response.actions?.find((a: any) => a.name === 'generate-qr-code')
        ?.url,
      expiresAt: response.expiry_time,
    };
  }
  /* eslint-enable */

  verifyWebhookSignature(params: {
    orderId: string;
    statusCode: string;
    grossAmount: string;
    signature: string;
  }) {
    const serverKey = this.config.get<string>('MIDTRANS_SERVER_KEY');
    const hash = crypto
      .createHash('sha512')
      .update(
        `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`,
      )
      .digest('hex');

    return hash === params.signature;
  }
}
