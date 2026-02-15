import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUsersDto } from 'users/dto/dto.users';
import { UpdateStoreDto } from 'stores/dto/dto.store';

@Controller('api/v1/users')
export class UsersController {
  constructor(private services: UsersService) {}

  @Get()
  findAll() {
    return this.services.findAll();
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
