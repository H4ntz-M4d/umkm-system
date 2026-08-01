import { Body, Controller, Post } from '@nestjs/common';
import { CustomerOrderService } from 'order/customer-order.service';
import { PosTransactionService } from 'pos-transaction/pos-transaction/pos-transaction.service';

/**
 * Satu-satunya URL notifikasi yang didaftarkan di dashboard Midtrans.
 *
 * Dashboard Midtrans hanya menyediakan satu field Payment Notification URL, dan
 * versi SDK yang dipakai tidak bisa menyisipkan header X-Override-Notification
 * per transaksi. Jadi notifikasi ditampung di sini lalu disalurkan berdasarkan
 * awalan `order_id` — yang bentuknya sudah pasti karena dibuat idFormat():
 *
 *   ORDER-20260727-FGG2  -> penjualan online
 *   POS-20260727-A3F9    -> transaksi kasir
 *
 * Verifikasi tanda tangan sengaja TIDAK dilakukan di sini, melainkan tetap di
 * masing-masing service, supaya tidak ada jalur yang bisa lolos tanpa diperiksa
 * dan kedua service tetap bisa dipanggil mandiri.
 */
@Controller('api/v1/webhooks')
export class MidtransWebhookController {
  constructor(
    private readonly customerOrderService: CustomerOrderService,
    private readonly posTransactionService: PosTransactionService,
  ) {}

  /* eslint-disable */
  @Post('midtrans')
  async handleMidtrans(@Body() body: any) {
    const orderId: unknown = body?.order_id;

    if (typeof orderId === 'string') {
      if (orderId.startsWith('ORDER-')) {
        return await this.customerOrderService.handleMidtransWebHook(body);
      }

      if (orderId.startsWith('POS-')) {
        return await this.posTransactionService.handleMidtransWebHook(body);
      }
    }

    // Nomor yang tidak dikenal tetap dibalas 200. Kalau dibalas error, Midtrans
    // akan mengulang kirim notifikasi yang memang bukan milik kita.
    return { received: true };
  }
  /* eslint-enable */
}
