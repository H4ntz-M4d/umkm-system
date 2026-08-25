import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { sendWorkbook } from 'common/helpers/excel';
import { PosTransactionService } from './pos-transaction.service';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { Pagination } from 'common/paginate/pagination';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { resolveTransactionStore } from 'common/helpers/resolve-store';

@Controller('api/v1/pos-transactions')
export class PosTransactionController {
  constructor(private posTransactionService: PosTransactionService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('paymentChannel') paymentChannel?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.posTransactionService.findMany(
      pagination,
      search,
      paymentChannel,
      storeId,
      status,
      dateFrom,
      dateTo,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get('/export')
  async exportExcel(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('paymentChannel') paymentChannel?: string,
    @Query('storeId') storeId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { buffer, filename } =
      await this.posTransactionService.exportWorkbook(
        search,
        paymentChannel,
        storeId,
        status,
        dateFrom,
        dateTo,
      );

    sendWorkbook(res, buffer, filename);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get('/parked')
  async findAllByParked() {
    return await this.posTransactionService.findManyByParked();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get(':id/check-status')
  async cekStatusTransaction(@Param('id', ParseIntPipe) transPosId: bigint) {
    return await this.posTransactionService.cekStatusTransaction(transPosId);
  }

  /**
   * Toko dan kasir diambil dari token, bukan dari body.
   *
   * Kasir terkunci ke tokonya sendiri; `storeId` di body hanya dilirik untuk
   * Owner dan Admin yang memang tidak terikat satu toko. Dengan begitu tidak ada
   * lagi jalan mencatat transaksi atas nama toko atau kasir orang lain.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Post()
  async upsert(
    @Body() data: CreatePosTransactionDto,
    @AuthUser() user: JwtPayload,
  ) {
    const storeId = await resolveTransactionStore(user, data.storeId);

    return await this.posTransactionService.upsert(
      data,
      storeId,
      BigInt(user.sub),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Post(':id/upload-paymentProof')
  @UseInterceptors(FileInterceptor('paymentProof'))
  async uploadPaymentProof(
    @Param('id', ParseIntPipe) transPosId: bigint,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.posTransactionService.uploadProodOfPayment(
      transPosId,
      file,
    );
  }

  // Dipanggil server-to-server oleh Midtrans, sengaja tanpa guard (bukan request user login)
  //
  // Juga dikecualikan dari rate limiting — lihat alasannya di
  // order.controller.ts: notifikasi yang ditolak 429 tidak pernah dikirim ulang
  // selamanya, dan transaksi kasir yang sudah dibayar bisa tertinggal PENDING.
  @SkipThrottle()
  @Post('/webhook/midtrans')
  async handleMidtransWebhook(@Body() body: any) {
    return await this.posTransactionService.handleMidtransWebHook(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Patch('/completed-transaction')
  async completedTransactions(@Param('id', ParseIntPipe) transPosId: bigint) {
    return await this.posTransactionService.completedTransaction(transPosId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Patch('/cancelled')
  async cancelTransactions(@Body() transId: string[]) {
    return await this.posTransactionService.cancelTransaction(transId);
  }
}
