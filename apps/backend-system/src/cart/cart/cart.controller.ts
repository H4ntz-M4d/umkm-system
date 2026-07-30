import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { resolveCustomerId } from 'common/helpers/resolve-customer';
import {
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from 'cart/dto/cart.dto';
import { CartService } from './cart.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('api/v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@AuthUser() user: JwtPayload) {
    const customerId = await resolveCustomerId(user.sub);
    return this.cartService.getCart(customerId);
  }

  @Post('items')
  async addItem(@AuthUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    const customerId = await resolveCustomerId(user.sub);
    return this.cartService.addItem(customerId, dto);
  }

  @Patch('items/:id')
  async updateItem(
    @AuthUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: bigint,
    @Body() dto: UpdateCartItemDto,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    return this.cartService.updateItem(customerId, id, dto);
  }

  @Delete('items/:id')
  async removeItem(
    @AuthUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: bigint,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    return this.cartService.removeItem(customerId, id);
  }

  @Post('merge')
  async merge(@AuthUser() user: JwtPayload, @Body() dto: MergeCartDto) {
    const customerId = await resolveCustomerId(user.sub);
    return this.cartService.merge(customerId, dto);
  }
}
