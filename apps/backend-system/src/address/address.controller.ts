import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { resolveCustomerId } from 'common/helpers/resolve-customer';
import {
  CustomerAddressDto,
  UpdateCustomerAddressDto,
} from 'address/dto/address.dto';
import { AddressService } from './address.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('api/v1/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  async findAll(@AuthUser() user: JwtPayload) {
    const customerId = await resolveCustomerId(user.sub);
    return this.addressService.findAll(customerId);
  }

  @Post()
  async create(@AuthUser() user: JwtPayload, @Body() dto: CustomerAddressDto) {
    const customerId = await resolveCustomerId(user.sub);
    return this.addressService.create(customerId, dto);
  }

  @Put(':id')
  async update(
    @AuthUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: bigint,
    @Body() dto: UpdateCustomerAddressDto,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    return this.addressService.update(customerId, id, dto);
  }

  @Patch(':id/default')
  async setDefault(
    @AuthUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: bigint,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    return this.addressService.setDefault(customerId, id);
  }

  @Delete(':id')
  async remove(
    @AuthUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: bigint,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    return this.addressService.remove(customerId, id);
  }
}
