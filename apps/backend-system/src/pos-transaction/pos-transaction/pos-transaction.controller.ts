import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PosTransactionService } from './pos-transaction.service';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { Pagination } from 'common/paginate/pagination';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Post()
  async upsert(@Body() data: CreatePosTransactionDto) {
    return await this.posTransactionService.upsert(data);
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
