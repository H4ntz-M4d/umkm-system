import { Prisma } from '@repo/db';
import { variantImageGroupSelect } from 'products/products/products.response';

/// Select yang dipakai riwayat pesanan customer. Lebih kaya dari versi admin
/// karena ikut membawa gambar dan slug untuk ditautkan kembali ke produk.
export const customerOrderInclude = {
  payment: { select: { name: true } },
  shipment: true,
  items: {
    select: {
      id: true,
      quantity: true,
      price: true,
      subtotal: true,
      notes: true,
      variant: {
        select: {
          id: true,
          isActive: true,
          imageGroup: variantImageGroupSelect,
          productMaster: { select: { name: true, slug: true, status: true } },
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
  },
} satisfies Prisma.OrderInclude;

type CustomerOrderEntity = Prisma.OrderGetPayload<{
  include: typeof customerOrderInclude;
}>;

export function toCustomerOrderResponse(entity: CustomerOrderEntity) {
  const items = entity.items.map((item) => ({
    id: String(item.id),
    /// Dibawa supaya tombol "Pesan lagi" tahu varian mana yang dimasukkan
    /// kembali ke keranjang — tanpa ini, satu-satunya petunjuk hanyalah nama
    /// produk, yang tidak cukup untuk memilih varian.
    productVariantId: String(item.variant.id),
    /**
     * Apakah barangnya masih dijual hari ini.
     *
     * Pesanan lama bisa memuat produk yang sudah ditarik dari katalog.
     * Keranjang sendiri tidak memeriksanya, jadi penanda ini yang membuat
     * tombol pesan ulang melewatinya dan mengatakan alasannya — bukan
     * memasukkan barang yang tidak bisa dibeli lagi.
     */
    isAvailable:
      item.variant.isActive && item.variant.productMaster.status === 'ACTIVE',
    productName: item.variant.productMaster.name,
    slug: item.variant.productMaster.slug,
    image: item.variant.imageGroup?.images[0]?.image ?? null,
    options: Object.fromEntries(
      item.variant.options.map((opt) => [
        opt.variantValue.variantType.name,
        opt.variantValue.value,
      ]),
    ),
    quantity: item.quantity,
    price: String(item.price),
    subtotal: String(item.subtotal),
    notes: item.notes,
  }));

  return {
    orderId: entity.orderId,
    status: entity.status,
    deliveryMethod: entity.deliveryMethod,
    /// Perkiraan dari harga katalog saat diajukan — dibawa supaya pembeli bisa
    /// melihat sendiri bedanya dengan angka hasil kesepakatan.
    estimatedTotal: String(entity.estimatedTotal),
    totalAmount: String(entity.totalAmount),
    dpAmount: entity.dpAmount ? String(entity.dpAmount) : null,
    createdAt: entity.createdAt.toISOString(),
    paymentMethodName: entity.payment?.name ?? '',
    // Hanya berguna selama pesanan masih menunggu bayar; setelah lunas token
    // Snap-nya tidak dipakai lagi.
    snapToken: entity.status === 'PENDING' ? entity.paymentGatewayRef : null,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    items,
    shipment: entity.shipment
      ? {
          id: String(entity.shipment.id),
          recipientName: entity.shipment.recipientName,
          phone: entity.shipment.phone,
          addressLine: entity.shipment.addressLine,
          city: entity.shipment.city,
          province: entity.shipment.province,
          courier: entity.shipment.courier,
          trackingNumber: entity.shipment.trackingNumber,
          status: entity.shipment.status,
          shippingCost: String(entity.shipment.shippingCost),
          createdAt: entity.shipment.createdAt.toISOString(),
        }
      : null,
  };
}
