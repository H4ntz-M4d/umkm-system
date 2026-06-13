import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PosTransactionService } from './pos-transaction.service';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';
import { Pagination } from 'common/paginate/pagination';

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

  @Post()
  async upsert(@Body() data: CreatePosTransactionDto) {
    return await this.posTransactionService.upsert(data);
  }

  @Patch('/cancelled')
  async cancelTransactions(@Body() transId: string[]) {
    return await this.posTransactionService.cancelTransaction(transId);
  }
}
