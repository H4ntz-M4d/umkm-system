import { Injectable } from '@nestjs/common';
import { prisma } from '@repo/db';
import {
  toWishlistItemResponse,
  wishlistProductSelect,
} from './wishlist.response';

@Injectable()
export class WishlistService {
  async findAll(customerId: bigint) {
    const data = await prisma.wishlist.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        product: wishlistProductSelect,
      },
    });

    return data.map(toWishlistItemResponse);
  }

  async findIds(customerId: bigint) {
    const data = await prisma.wishlist.findMany({
      where: { customerId },
      select: { productMasterId: true },
    });

    return data.map((item) => String(item.productMasterId));
  }

  async toggle(customerId: bigint, productMasterId: bigint) {
    const existing = await prisma.wishlist.findUnique({
      where: { customerId_productMasterId: { customerId, productMasterId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return { inWishlist: false };
    }

    await prisma.wishlist.create({ data: { customerId, productMasterId } });
    return { inWishlist: true };
  }

  async remove(customerId: bigint, productMasterId: bigint) {
    await prisma.wishlist.deleteMany({
      where: { customerId, productMasterId },
    });
  }
}
