import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from 'expense/dto/expense.dto';

@Controller('api/v1/expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  findAll(@Query() pagination: Pagination, @Query('search') search?: string) {
    return this.expenseService.findAll(pagination, search);
  }

  @Post()
  create(@Body() data: ExpenseDto) {
    return this.expenseService.create(data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseService.remove(id);
  }
}
