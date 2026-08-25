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
  CheckoutDto,
  MyOrderQueryDto,
  OrderQueryDto,
  UpdateShipmentDto,
} from 'order/dto/order.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
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

  /// Checkout memesan stok dan membuat transaksi Midtrans. Sepuluh per menit
  /// jauh di atas pemakaian wajar, tapi cukup untuk menahan klik ganda beruntun
  /// dan percobaan membuat pesanan massal.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Post('checkout')
  checkout(@AuthUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.customerOrderService.checkout(user.sub, dto);
  }

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

  /// Menanyakan status sebenarnya ke Midtrans lalu menyelaraskan pesanan.
  /// Jaring pengaman untuk notifikasi webhook yang tidak pernah sampai.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @Post('me/:orderId/sync')
  syncPaymentStatus(
    @AuthUser() user: JwtPayload,
    @Param('orderId') orderId: string,
  ) {
    return this.customerOrderService.syncPaymentStatus(user.sub, orderId);
  }

  // ============================== Webhook ====================================

  /// Publik — Midtrans memanggilnya tanpa sesi. Keasliannya diverifikasi lewat
  /// tanda tangan SHA-512 di dalam service.
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
