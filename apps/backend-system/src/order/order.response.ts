import { Prisma } from '@repo/db';

interface OrderAllEntity extends Prisma.OrderGetPayload<{
  select: {
    id: true;
    storeId: true;
    orderId: true;
    status: true;
    deliveryMethod: true;
    estimatedTotal: true;
    totalAmount: true;
    dpAmount: true;
    buyerName: true;
    buyerPhone: true;
    userId: true;
    createdAt: true;
    store: {
      select: {
        name: true;
      };
    };
    customer: {
      select: {
        name: true;
      };
    };
    payment: {
      select: {
        name: true;
      };
    };
    items: {
      select: {
        id: true;
        quantity: true;
        price: true;
        subtotal: true;
        notes: true;
        variant: {
          select: {
            sku: true;
            productMaster: {
              select: {
                name: true;
              };
            };
            options: {
              select: {
                variantValue: {
                  select: {
                    value: true;
                  };
                };
              };
            };
          };
        };
      };
    };
    user: {
      select: {
        employees: {
          select: {
            name: true;
          };
        };
      };
    };
    shipment: {
      select: {
        id: true;
        recipientName: true;
        phone: true;
        addressLine: true;
        city: true;
        province: true;
        courier: true;
        trackingNumber: true;
        status: true;
        shippingCost: true;
        totalWeight: true;
        unitWeight: true;
        unitPrice: true;
        createdAt: true;
      };
    };
  };
}> {}

export function toOrderResponse(entity: OrderAllEntity) {
  return {
    storeId: entity.storeId,
    storeName: entity.store.name,
    /// Pesanan tamu tidak punya baris Customer — namanya diambil dari kontak
    /// yang diisi sendiri saat memesan, supaya tidak muncul kosong di daftar.
    customerName: entity.customer?.name ?? entity.buyerName ?? '',
    buyerName: entity.buyerName,
    buyerPhone: entity.buyerPhone,
    orderId: entity.orderId,
    paymentMethodName: entity.payment?.name ?? '',
    status: entity.status,
    deliveryMethod: entity.deliveryMethod,
    estimatedTotal: entity.estimatedTotal,
    totalAmount: entity.totalAmount,
    dpAmount: entity.dpAmount,
    processedById: entity.userId,
    /// Nama diambil lewat relasi karyawan; akun tanpa baris karyawan (data
    /// lama) tetap tampil sebagai kosong, bukan bikin respons gagal.
    processedByName: entity.user?.employees?.name ?? null,
    createdAt: entity.createdAt,
    items: entity.items.map((item) => {
      const variantValues = item.variant.options
        .map((opt) => opt.variantValue.value)
        .join(' - ');

      return {
        id: item.id,
        productName: variantValues
          ? `${item.variant.productMaster.name} - ${variantValues} - ${item.variant.sku}`
          : `${item.variant.productMaster.name} - ${item.variant.sku}`,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        notes: item.notes,
      };
    }),
    shipment: entity.shipment
      ? {
          id: entity.shipment.id,
          recipientName: entity.shipment.recipientName,
          phone: entity.shipment.phone,
          addressLine: entity.shipment.addressLine,
          city: entity.shipment.city,
          province: entity.shipment.province,
          courier: entity.shipment.courier,
          trackingNumber: entity.shipment.trackingNumber,
          status: entity.shipment.status,
          shippingCost: entity.shipment.shippingCost,
          /// Catatan paket — hanya ada di bentuk admin; mapper sisi customer
          /// (customer-order.response.ts) sengaja tidak memilihnya.
          totalWeight: entity.shipment.totalWeight,
          unitWeight: entity.shipment.unitWeight,
          unitPrice: entity.shipment.unitPrice,
          createdAt: entity.shipment.createdAt,
        }
      : null,
  };
}
