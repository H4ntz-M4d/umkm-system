import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { EXPENSE_PROOF_MAX_FILES } from '@repo/schemas';
import { validateImageFiles } from 'common/interceptors/upload-image.interceptors';
import type { Response } from 'express';
import { Pagination } from 'common/paginate/pagination';
import { ExpenseService } from './expense.service';
import { ExpenseDto, UpdateExpenseDto } from 'expense/dto/expense.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { sendWorkbook } from 'common/helpers/excel';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';

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

  /// Pencatatnya diambil dari token — lihat catatan di service.
  @Post()
  create(@Body() data: ExpenseDto, @AuthUser() user: JwtPayload) {
    return this.expenseService.create(data, BigInt(user.sub));
  }

  /// Detail lengkap (item + bukti), dipakai saat dialog dibuka untuk diedit.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseService.findOne(BigInt(id));
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: UpdateExpenseDto,
  ) {
    return this.expenseService.update(BigInt(id), data);
  }

  /**
   * Lampiran bukti. Batas jumlahnya diperiksa dua kali dengan maksud berbeda:
   * di sini untuk satu unggahan, dan di service terhadap yang sudah ada.
   */
  @Post(':id/proofs')
  @UseInterceptors(FilesInterceptor('images', EXPENSE_PROOF_MAX_FILES))
  uploadProofs(
    @Param('id', ParseIntPipe) id: bigint,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    validateImageFiles(files, EXPENSE_PROOF_MAX_FILES);
    return this.expenseService.uploadProofs(BigInt(id), files);
  }

  @Delete(':id/proofs/:proofId')
  removeProof(
    @Param('id', ParseIntPipe) id: bigint,
    @Param('proofId', ParseIntPipe) proofId: bigint,
  ) {
    return this.expenseService.removeProof(BigInt(id), BigInt(proofId));
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.expenseService.remove(BigInt(id));
  }
}
