import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@repo/db';
import { JwtAuthGuard } from 'common/guards/guard.jwt-auth';
import { RolesGuard } from 'common/guards/guard.roles';
import { Roles } from 'common/decorator/roles.decorator';
import { AuthUser, type JwtPayload } from 'common/decorator/auth.decorator';
import { resolveCustomerId } from 'common/helpers/resolve-customer';
import { ToggleWishlistDto } from 'wishlist/dto/wishlist.dto';
import { WishlistService } from './wishlist.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
@Controller('api/v1/wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async findAll(@AuthUser() user: JwtPayload) {
    const customerId = await resolveCustomerId(user.sub);
    return this.wishlistService.findAll(customerId);
  }

  @Get('ids')
  async findIds(@AuthUser() user: JwtPayload) {
    const customerId = await resolveCustomerId(user.sub);
    return this.wishlistService.findIds(customerId);
  }

  @Post('toggle')
  async toggle(@AuthUser() user: JwtPayload, @Body() dto: ToggleWishlistDto) {
    const customerId = await resolveCustomerId(user.sub);
    return this.wishlistService.toggle(customerId, BigInt(dto.productMasterId));
  }

  @Delete(':productId')
  async remove(
    @AuthUser() user: JwtPayload,
    @Param('productId', ParseIntPipe) productId: bigint,
  ) {
    const customerId = await resolveCustomerId(user.sub);
    await this.wishlistService.remove(customerId, productId);
    return { removed: true };
  }
}
