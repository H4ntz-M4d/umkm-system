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

  /**
   * Token Snap untuk pembayaran order online.
   *
   * docs -> https://docs.midtrans.com/reference/snap-1
   *
   * Midtrans menolak transaksi bila jumlah item_details tidak sama persis dengan
   * gross_amount, jadi gross dihitung dari baris item yang sudah dibulatkan —
   * bukan dari total yang dihitung terpisah.
   */

  async createSnapTransaction(params: {
    orderId: string;
    items: { id: string; name: string; price: number; quantity: number }[];
    shippingCost?: number;
    customer?: { name?: string; email?: string; phone?: string };
    finishUrl?: string;
  }) {
    const itemDetails = params.items.map((item) => ({
      id: item.id,
      // Midtrans memotong nama item di 50 karakter.
      name: item.name.slice(0, 50),
      price: Math.round(item.price),
      quantity: item.quantity,
    }));

    const shippingCost = Math.round(params.shippingCost ?? 0);
    if (shippingCost > 0) {
      itemDetails.push({
        id: 'SHIPPING',
        name: 'Ongkos Kirim',
        price: shippingCost,
        quantity: 1,
      });
    }

    const grossAmount = itemDetails.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    // @types/midtrans-client hanya mendeklarasikan transaction_details, padahal
    // API-nya menerima item_details dan customer_details. Dicast agar tipe yang
    // kurang lengkap itu tidak menghalangi.
    const payload = {
      transaction_details: {
        order_id: params.orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: params.customer?.name,
        email: params.customer?.email,
        phone: params.customer?.phone,
      },
      // Menimpa Finish Redirect URL dashboard khusus transaksi ini, jadi tombol
      // kembali di halaman Snap mengarah ke halaman pesanan kita.
      ...(params.finishUrl && { callbacks: { finish: params.finishUrl } }),
    } as unknown as Midtrans.SnapTransactionParameters;

    const response = await this.snap.createTransaction(payload);

    return {
      token: String(response.token),
      redirectUrl: String(response.redirect_url),
      grossAmount,
    };
  }

  /**
   * Menanyakan status sebenarnya sebuah transaksi langsung ke Midtrans.
   *
   * docs -> https://docs.midtrans.com/reference/get-transaction-status
   *
   * Notifikasi webhook bisa gagal terkirim (URL salah, server sedang mati,
   * jaringan putus) dan Midtrans tidak menyediakan cara memintanya dikirim ulang
   * lewat API. Karena itu status ditarik sendiri sebagai jaring pengaman.
   *
   * Mengembalikan null bila transaksi tidak dikenal Midtrans — misalnya order
   * yang tokennya gagal terbit, atau yang belum pernah dibuka pembeli.
   */
  /* eslint-disable */
  async getTransactionStatus(orderId: string): Promise<{
    transactionStatus: string;
    fraudStatus?: string;
    grossAmount?: string;
  } | null> {
    try {
      // Sama seperti createSnapTransaction: @types/midtrans-client hanya
      // mendeklarasikan charge() pada CoreApi, padahal SDK-nya juga menyediakan
      // core.transaction.status().
      const core = this.core as unknown as {
        transaction: { status: (id: string) => Promise<any> };
      };

      const response = await core.transaction.status(orderId);

      return {
        transactionStatus: String(response.transaction_status),
        fraudStatus: response.fraud_status
          ? String(response.fraud_status)
          : undefined,
        grossAmount: response.gross_amount
          ? String(response.gross_amount)
          : undefined,
      };
    } catch (error: any) {
      // 404 dari Midtrans berarti transaksinya memang belum/tidak ada — itu
      // kondisi normal, bukan kegagalan yang perlu dilempar ke pemanggil.
      const httpStatus = error?.httpStatusCode ?? error?.ApiResponse?.status_code;
      if (String(httpStatus) === '404') return null;

      throw error;
    }
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
