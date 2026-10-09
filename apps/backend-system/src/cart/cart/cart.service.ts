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

    /// Keranjang online tidak dibatasi stok: semua pesanan online dikerjakan
    /// rumah produksi setelah dipesan, dan stok toko hanya dijual lewat kasir.
    /// Kuota pre-order dijaga saat pesanan diajukan (submitOrderRequest).

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

      /// Menambah varian yang sudah ada di keranjang menjumlahkan, bukan
      /// menimpa — sama seperti keranjang tamu. Dulu jalur made-to-order
      /// menimpanya dengan jumlah terakhir yang ditambahkan.
      const quantity = (existing?.quantity ?? 0) + dto.quantity;

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

    // Tidak dibatasi stok — lihat keterangan di addItem.
    const quantity = dto.quantity;

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
