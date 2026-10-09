import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_VALIDATOR } from 'common/interceptors/upload-image.interceptors';
import { PaymentService } from './payment.service';
import { PaymentMethodDto } from 'payment/payment.dto';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { UserRole } from '@repo/db';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/payment-method')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * Daftar metode pembayaran.
   *
   * Kasir selalu dikunci ke tokonya sendiri: `storeId` dari query sengaja
   * diabaikan untuk mereka, supaya rekening toko lain tidak bisa diintip
   * hanya dengan mengganti angka di URL.
   *
   * Owner dan Admin mengelola seluruh toko, jadi merekalah yang menentukan
   * lewat query — layar POS mengirim toko yang sedang aktif, sedangkan layar
   * pengelolaan tidak mengirim apa-apa dan menerima semuanya.
   */
  @Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.KASIR)
  @Get()
  findAll(@AuthUser() user: JwtPayload, @Query('storeId') storeId?: string) {
    const scope = user.role === UserRole.KASIR ? user.storeId : storeId;
    return this.paymentService.findAll(scope ? BigInt(scope) : undefined);
  }

  /// Didaftarkan sebelum rute berparameter supaya "qris-image" tidak
  /// tertangkap sebagai sebuah id.
  @Post('/qris-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadQrImage(
    @UploadedFile(IMAGE_VALIDATOR(true)) file: Express.Multer.File,
  ) {
    return this.paymentService.uploadQrImage(file);
  }

  @Post()
  create(@Body() data: PaymentMethodDto) {
    return this.paymentService.create(data);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: bigint,
    @Body() data: PaymentMethodDto,
  ) {
    return this.paymentService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: bigint) {
    return this.paymentService.remove(id);
  }
}
