import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@repo/db';
import { onlineStockSelect } from 'common/helpers/online-store';
import {
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from 'cart/dto/cart.dto';
import { cartItemSelect, toCartResponse } from './cart.response';
import { async, merge } from 'rxjs';
import { bigint } from 'zod';

@Injectable()
export class CartService {
  private async findCartEntity(customerId: bigint) {
    return prisma.cart.findUnique({
      where: { customerId },
      include: { cartItems: cartItemSelect },
    });
  }

  async getCart(customerId: bigint) {
    return toCartResponse(await this.findCartEntity(customerId));
  }

  async addItem(customerId: bigint, dto: AddCartItemDto) {
    const variantId = BigInt(dto.productVariantId);

    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        productVariantStocks: onlineStockSelect,
        productMaster: { select: { type: true } },
      },
    });
    if (!variant) throw new NotFoundException('Varian produk tidak ditemukan');

    const stock = variant.productVariantStocks[0]?.stock ?? 0;
    if (
      variant.productMaster.type !== 'MADE_TO_ORDER' &&
      variant.productMaster.type !== 'PRE_ORDER'
    ) {
      if (stock <= 0)
        throw new BadRequestException('Stok produk ini sedang habis');
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { customerId },
        create: { customerId },
        update: {},
      });

      const existing = await tx.cartItem.findUnique({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variantId,
          },
        },
      });

      let quantity;
      if (
        variant.productMaster.type !== 'MADE_TO_ORDER' &&
        variant.productMaster.type !== 'PRE_ORDER'
      ) {
        quantity = Math.min(stock, (existing?.quantity ?? 0) + dto.quantity);
      } else {
        quantity = dto.quantity;
      }

      await tx.cartItem.upsert({
        where: {
          cartId_productVariantId: {
            cartId: cart.id,
            productVariantId: variantId,
          },
        },
        create: { cartId: cart.id, productVariantId: variantId, quantity },
        update: { quantity },
      });
    });

    return this.getCart(customerId);
  }

  async updateItem(customerId: bigint, itemId: bigint, dto: UpdateCartItemDto) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { customerId: true } },
        variant: {
          select: {
            productVariantStocks: onlineStockSelect,
            productMaster: { select: { type: true } },
          },
        },
      },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException('Item keranjang tidak ditemukan');
    }

    const stock = item.variant.productVariantStocks[0]?.stock ?? 0;
    if (
      item.variant.productMaster.type !== 'MADE_TO_ORDER' &&
      item.variant.productMaster.type !== 'PRE_ORDER'
    ) {
      if (stock <= 0)
        throw new BadRequestException('Stok produk ini sedang habis');
    }

    let quantity;
    if (
      item.variant.productMaster.type !== 'MADE_TO_ORDER' &&
      item.variant.productMaster.type !== 'PRE_ORDER'
    ) {
      quantity = Math.min(dto.quantity, stock);
    } else {
      quantity = dto.quantity;
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: quantity },
    });

    return this.getCart(customerId);
  }

  async removeItem(customerId: bigint, itemId: bigint) {
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: { select: { customerId: true } } },
    });

    if (!item || item.cart.customerId !== customerId) {
      throw new NotFoundException('Item keranjang tidak ditemukan');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(customerId);
  }

  /**
   * Dipanggil sekali setelah login untuk memindahkan cart guest (localStorage)
   * ke cart server. Item yang stoknya sudah habis dilewati saja supaya satu
   * item bermasalah tidak menggagalkan seluruh merge.
   */
  async merge(customerId: bigint, dto: MergeCartDto) {
    if (dto.items.length === 0) return this.getCart(customerId);

    const variantIds = dto.items.map((item) => BigInt(item.productVariantId));

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { customerId },
        create: { customerId },
        update: {},
      });

      const [stocks, existingItems] = await Promise.all([
        tx.productVariantStock.findMany({
          where: { productVariantId: { in: variantIds } },
          select: { productVariantId: true, stock: true },
        }),
        tx.cartItem.findMany({
          where: { cartId: cart.id, productVariantId: { in: variantIds } },
        }),
      ]);

      for (const guestItem of dto.items) {
        const variantId = BigInt(guestItem.productVariantId);
        const stock =
          stocks.find((s) => s.productVariantId === variantId)?.stock ?? 0;
        if (stock <= 0) continue;

        const existingQty =
          existingItems.find((i) => i.productVariantId === variantId)
            ?.quantity ?? 0;
        const quantity = Math.min(stock, existingQty + guestItem.quantity);

        await tx.cartItem.upsert({
          where: {
            cartId_productVariantId: {
              cartId: cart.id,
              productVariantId: variantId,
            },
          },
          create: { cartId: cart.id, productVariantId: variantId, quantity },
          update: { quantity },
        });
      }
    });

    return this.getCart(customerId);
  }
}
