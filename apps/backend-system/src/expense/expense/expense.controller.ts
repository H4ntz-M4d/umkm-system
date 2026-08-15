import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseService } from './expense.service';
import { ExpenseDto } from 'expense/dto/expense.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { sendWorkbook } from 'common/helpers/excel';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  /// Didaftarkan sebelum rute berparameter agar "/export" tidak tertangkap
  /// sebagai sebuah id.
  @Get('/export')
  async exportExcel(
    @Res() res: Response,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const { buffer, filename } = await this.expenseService.exportWorkbook(
      search,
      category,
      dateFrom,
      dateTo,
    );

    sendWorkbook(res, buffer, filename);
  }

  @Get()
  findAll(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.expenseService.findAll(
      pagination,
      search,
      category,
      dateFrom,
      dateTo,
    );
  }

  @Get('/summary')
  summary() {
    return this.expenseService.summary();
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
