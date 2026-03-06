import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from 'users/dto/dto.users';
import { UpdateStoreDto } from 'stores/dto/dto.store';
import { Pagination } from 'common/paginate/pagination';
import { Roles } from 'common/decorator/roles.decorator';
import { UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';

@Controller('api/v1/users')
export class UsersController {
  constructor(private services: UsersService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('/employees')
  findAllAdmin(@Query() pagination: Pagination) {
    return this.services.findAllAdmin(pagination);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Get('/customers')
  findAllCustomer(@Query() pagination: Pagination) {
    return this.services.findAllCustomer(pagination);
  }

  @Get(':id')
  findById(@Param('id') id: string){
    return this.services.findById(BigInt(id))
  }

  @Post()
  create(@Body() dto: CreateUsersDto) {
    return this.services.create(dto);
  }

  @Patch(':id')
  update(@Body() dto: UpdateStoreDto, @Param('id') id: string) {
    return this.services.update(BigInt(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string ){
    return this.services.remove(BigInt(id))
  }
}
