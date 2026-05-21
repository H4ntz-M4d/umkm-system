import { Body, Controller, Get, Post } from '@nestjs/common';
import { PosTransactionService } from './pos-transaction.service';
import { CreatePosTransactionDto } from 'pos-transaction/dto/pos-transaction.dto';

@Controller('api/v1/pos-transaction')
export class PosTransactionController {
  constructor(private posTransactionService: PosTransactionService) {}

  @Get()
  async findAll() {
    return await this.posTransactionService.findMany();
  }

  @Get()
  async findAllByParked() {
    return await this.posTransactionService.findManyByParked();
  }

  @Post()
  async upsert(@Body() data: CreatePosTransactionDto) {
    return await this.posTransactionService.upsert(data);
  }
}
