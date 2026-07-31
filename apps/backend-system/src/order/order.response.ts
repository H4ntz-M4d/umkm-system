import { Prisma } from '@repo/db';

interface OrderAllEntity extends Prisma.OrderGetPayload<{
  select: {
    id: true;
    storeId: true;
    orderId: true;
    status: true;
    totalAmount: true;
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
        variant: {
          select: {
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
        createdAt: true;
      };
    };
  };
}> {}

export function toOrderResponse(entity: OrderAllEntity) {
  return {
    storeId: entity.storeId,
    storeName: entity.store.name,
    customerName: entity.customer?.name ?? '',
    orderId: entity.orderId,
    paymentMethodName: entity.payment?.name ?? '',
    status: entity.status,
    totalAmount: entity.totalAmount,
    createdAt: entity.createdAt,
    items: entity.items.map((item) => {
      const variantValues = item.variant.options
        .map((opt) => opt.variantValue.value)
        .join(' - ');

      return {
        id: item.id,
        productName: variantValues
          ? `${item.variant.productMaster.name} - ${variantValues}`
          : item.variant.productMaster.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
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
          createdAt: entity.shipment.createdAt,
        }
      : null,
  };
}
