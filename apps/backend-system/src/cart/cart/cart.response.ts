import { Prisma } from '@repo/db';
import { variantImageGroupSelect } from 'products/products/products.response';
import { onlineStockSelect } from 'common/helpers/online-store';

export const cartItemSelect = {
  select: {
    id: true,
    productVariantId: true,
    quantity: true,
    variant: {
      select: {
        sku: true,
        price: true,
        imageGroupId: true,
        imageGroup: variantImageGroupSelect,
        productMaster: {
          select: { id: true, name: true, slug: true, type: true },
        },
        productVariantStocks: onlineStockSelect,
        options: {
          select: {
            variantValue: {
              select: {
                value: true,
                variantType: { select: { name: true } },
              },
            },
          },
        },
      },
    },
  },
  orderBy: { id: 'asc' },
} satisfies Prisma.Cart$cartItemsArgs;

function flattenImage(variant: {
  imageGroup: { images: { image: string }[] } | null;
}) {
  return variant.imageGroup?.images[0]?.image ?? null;
}

type CartEntity = Prisma.CartGetPayload<{
  include: { cartItems: typeof cartItemSelect };
}>;

const EMPTY_CART = {
  id: null,
  items: [],
  totalItems: 0,
  totalAmount: '0',
};

export function toCartResponse(entity: CartEntity | null) {
  if (!entity) return EMPTY_CART;

  const items = entity.cartItems.map((item) => {
    const stock = item.variant.productVariantStocks[0]?.stock ?? 0;
    const subtotal = Number(item.variant.price) * item.quantity;

    return {
      id: String(item.id),
      productVariantId: String(item.productVariantId),
      productMasterId: String(item.variant.productMaster.id),
      slug: item.variant.productMaster.slug,
      sku: item.variant.sku,
      productName: item.variant.productMaster.name,
      productType: item.variant.productMaster.type,
      price: String(item.variant.price),
      image: flattenImage(item.variant),
      stock,
      quantity: item.quantity,
      options: Object.fromEntries(
        item.variant.options.map((opt) => [
          opt.variantValue.variantType.name,
          opt.variantValue.value,
        ]),
      ),
      subtotal: String(subtotal),
    };
  });

  return {
    id: String(entity.id),
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    totalAmount: String(
      items.reduce((total, item) => total + Number(item.subtotal), 0),
    ),
  };
}
