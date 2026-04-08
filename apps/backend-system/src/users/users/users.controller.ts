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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateEmployeeDto,
  CreateUsersDto,
  UpdateUsersDto,
} from 'users/dto/dto.users';
import { UpdateStoreDto } from 'stores/dto/dto.store';
import { Pagination } from 'common/paginate/pagination';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { FileInterceptor } from '@nestjs/platform-express';
import { IMAGE_VALIDATOR } from 'common/interceptors/upload-image.interceptors';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER, UserRole.ADMIN)
@Controller('api/v1/users')
export class UsersController {
  constructor(private services: UsersService) {}

  @Get('/employees')
  findAllAdmin(
    @Query() pagination: Pagination,
    @Query('search') search?: string,
  ) {
    return this.services.findAllAdmin(pagination, search);
  }

  @Get('/customers')
  findAllCustomer(@Query() pagination: Pagination) {
    return this.services.findAllCustomer(pagination);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: bigint) {
    return this.services.findById(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateEmployeeDto,
    @UploadedFile(IMAGE_VALIDATOR(false)) file?: Express.Multer.File,
  ) {
    return this.services.createAdmin(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: UpdateUsersDto,
    @Param('id') id: string,
    @UploadedFile(IMAGE_VALIDATOR(false)) file?: Express.Multer.File,
  ) {
    return this.services.update(BigInt(id), dto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.services.remove(BigInt(id));
  }
}
