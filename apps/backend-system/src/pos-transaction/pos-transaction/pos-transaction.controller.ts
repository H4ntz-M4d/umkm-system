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
  UseInterceptors,
} from '@nestjs/common';
import { PosTransactionService } from './pos-transaction.service';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { Pagination } from 'common/paginate/pagination';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/v1/pos-transactions')
export class PosTransactionController {
  constructor(private posTransactionService: PosTransactionService) {}

  @Get()
  async findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('paymentChannel') paymentChannel?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return await this.posTransactionService.findMany(
      pagination,
      search,
      paymentChannel,
      dateFrom,
      dateTo,
    );
  }

  @Get('/parked')
  async findAllByParked() {
    return await this.posTransactionService.findManyByParked();
  }

  @Get(':id/check-status')
  async cekStatusTransaction(@Param('id', ParseIntPipe) transPosId: bigint) {
    return await this.posTransactionService.cekStatusTransaction(transPosId);
  }

  @Post()
  async upsert(@Body() data: CreatePosTransactionDto) {
    return await this.posTransactionService.upsert(data);
  }

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

  // pos-transaction.controller.ts
  @Post('/webhook/midtrans')
  async handleMidtransWebhook(@Body() body: any) {
    return await this.posTransactionService.handleMidtransWebHook(body);
  }

  @Patch('/completed-transaction')
  async completedTransactions(@Param('id', ParseIntPipe) transPosId: bigint) {
    return await this.posTransactionService.completedTransaction(transPosId);
  }

  @Patch('/cancelled')
  async cancelTransactions(@Body() transId: string[]) {
    return await this.posTransactionService.cancelTransaction(transId);
  }
}
