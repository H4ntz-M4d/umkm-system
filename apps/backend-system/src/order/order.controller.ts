import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { sendWorkbook } from 'common/helpers/excel';
import { UserRole } from '@repo/db';
import { OrderService } from './order.service';
import { CustomerOrderService } from './customer-order.service';
import {
  MyOrderQueryDto,
  OrderQueryDto,
  SubmitOrderDto,
  UpdateOrderNegotiationDto,
  UpdateShipmentDto,
} from 'order/dto/order.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { OptionalJwtAuthGuard } from 'common/guards/guard.optional-jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import {
  AuthUser,
  OptionalAuthUser,
  type JwtPayload,
} from 'common/decorator/auth.decorator';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

/**
 * Guard dipasang per-method, bukan di level class: controller ini melayani tiga
 * penonton sekaligus — admin, customer, dan webhook Midtrans yang harus publik.
 */
@Controller('api/v1/orders')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly customerOrderService: CustomerOrderService,
  ) {}

  // ============================== Admin ======================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get()
  findAll(@Query() query: OrderQueryDto) {
    return this.orderService.findAll(query);
  }

  /// Didaftarkan sebelum rute berparameter agar "/export" tidak tertangkap
  /// sebagai sebuah orderId.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get('/export')
  async exportExcel(@Query() query: OrderQueryDto, @Res() res: Response) {
    const { buffer, filename } = await this.orderService.exportWorkbook(query);

    sendWorkbook(res, buffer, filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Patch('/cancelled')
  cancel(@Body() orderId: string[]) {
    return this.orderService.cancel(orderId);
  }

  /// Mencatat hasil nego WhatsApp: total yang disepakati, DP yang sudah masuk,
  /// dan pergeseran statusnya. Kasir ikut dibolehkan karena merekalah yang
  /// biasanya menerima transfer DP.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Patch(':orderId/negotiation')
  updateNegotiation(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderNegotiationDto,
    @AuthUser() user: JwtPayload,
  ) {
    return this.orderService.updateNegotiation(orderId, dto, user);
  }

  /// Pengiriman masih ditangani manual, jadi status dan nomor resi diperbarui
  /// admin/gudang lewat endpoint ini.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.GUDANG)
  @Patch(':orderId/shipment')
  updateShipment(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateShipmentDto,
  ) {
    return this.orderService.updateShipment(orderId, dto);
  }

  // ============================ Customer =====================================

  /**
   * Pengajuan pesanan dari katalog — boleh tanpa sesi.
   *
   * Tamu adalah warga kelas satu di sini: seluruh kelanjutan pesanan terjadi
   * lewat WhatsApp, jadi yang dibutuhkan cuma nama dan nomor yang bisa
   * dihubungi. `OptionalJwtAuthGuard` tetap mengisi `req.user` bila sesinya
   * ada, supaya pesanan customer yang sudah masuk tertaut ke akunnya.
   *
   * RolesGuard sengaja tidak dipasang: tidak ada peran yang bisa dicocokkan
   * untuk pengunjung tanpa akun.
   *
   * Throttle-nya menahan klik ganda beruntun dan pengajuan massal. Perlu
   * diingat rute ini menulis ke database tanpa sesi — yang menahan dampaknya
   * adalah kenyataan bahwa pengajuan tidak menggerakkan stok maupun kas sama
   * sekali sampai admin menetapkan PAID.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @Post('submit')
  submitOrderRequest(
    @OptionalAuthUser() user: JwtPayload | null,
    @Body() dto: SubmitOrderDto,
  ) {
    return this.customerOrderService.submitOrderRequest(user, dto);
  }

  /**
   * Rute alur bayar online lama — DINONAKTIFKAN, sengaja tidak dihapus.
   *
   * `POST checkout` dan `POST me/:orderId/sync` dicabut dari routing karena
   * storefront tidak lagi memakai Midtrans: pesanan masuk lewat `submit` di
   * atas, lalu harga dan DP-nya disepakati di WhatsApp.
   *
   * Method yang melayaninya — `CustomerOrderService.checkout`,
   * `syncPaymentStatus`, `applyPaymentStatus`, dan `handleMidtransWebHook` —
   * tetap utuh di service-nya, jadi alur lama bisa dihidupkan lagi hanya
   * dengan mengembalikan binding di bawah ini.
   *
   * `syncPaymentStatus` ikut dicabut, bukan hanya `checkout`: status PENDING
   * sekarang berarti "Mengajukan" dan bisa bertahan berhari-hari, sehingga
   * poller lama akan menanyakan tiap pesanan baru ke Midtrans padahal di sana
   * transaksinya memang tidak pernah ada.
   *
   * @Throttle({ default: { limit: 10, ttl: 60_000 } })
   * @UseGuards(JwtAuthGuard, RolesGuard)
   * @Roles(UserRole.CUSTOMER)
   * @Post('checkout')
   * checkout(@AuthUser() user: JwtPayload, @Body() dto: CheckoutDto) {
   *   return this.customerOrderService.checkout(user.sub, dto);
   * }
   *
   * @UseGuards(JwtAuthGuard, RolesGuard)
   * @Roles(UserRole.CUSTOMER)
   * @Post('me/:orderId/sync')
   * syncPaymentStatus(
   *   @AuthUser() user: JwtPayload,
   *   @Param('orderId') orderId: string,
   * ) {
   *   return this.customerOrderService.syncPaymentStatus(user.sub, orderId);
   * }
   */

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('me')
  findMyOrders(@AuthUser() user: JwtPayload, @Query() query: MyOrderQueryDto) {
    return this.customerOrderService.findMyOrders(user.sub, query);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Get('me/:orderId')
  findMyOrderDetail(
    @AuthUser() user: JwtPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.customerOrderService.findMyOrderDetail(user.sub, orderId);
  }

  // ============================== Webhook ====================================

  /// Publik — Midtrans memanggilnya tanpa sesi. Keasliannya diverifikasi lewat
  /// tanda tangan SHA-512 di dalam service.
  ///
  /// Kini tidak pernah lagi menerima notifikasi pesanan sungguhan: pesanan baru
  /// tidak pernah didaftarkan ke Midtrans. Dibiarkan terpasang — bukan dicabut
  /// seperti checkout dan sync — karena rute ini tidak pernah dipanggil
  /// storefront, dan pesanan lama yang masih menggantung tetap bisa
  /// diselaraskan kalau notifikasinya telat datang.
  ///
  /// Dikecualikan dari rate limiting: Midtrans mengulang notifikasi secara
  /// beruntun, dan semuanya datang dari kumpulan IP yang sama. Membalas 429
  /// berarti status pembayaran bisa tidak pernah masuk — pelanggan sudah
  /// membayar tapi pesanannya tetap PENDING.
  @SkipThrottle()
  @Post('/webhook/midtrans')
  handleWebhook(@Body() body: any) {
    return this.customerOrderService.handleMidtransWebHook(body);
  }
}
