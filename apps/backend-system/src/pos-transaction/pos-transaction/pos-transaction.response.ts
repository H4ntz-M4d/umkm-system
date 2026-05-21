import { Prisma } from '@repo/db';

interface PosTransactionAllEntity extends Prisma.PosTransactionGetPayload<{
  select: {
    id: true;
    transId: true;
    storeId: true;
    cashierId: true;
    paymentMethodId: true;
    totalAmount: true;
    createdAt: true;
    users: {
      select: {
        employees: {
          select: {
            name: true;
          };
        };
      };
    };
    paymentMethod: {
      select: {
        name: true;
        channel: true;
      };
    };
    items: {
      select: {
        productVariantId: true;
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
  };
}> {}

export function toPosTransactionResponse(entity: PosTransactionAllEntity) {
  return {
    id: entity.id,
    transId: entity.transId,
    storeId: entity.storeId,
    cashierName: entity.users.employees?.name,
    paymentMethod: entity.paymentMethod?.name,
    paymentChannel: entity.paymentMethod?.channel,
    totalAmount: entity.totalAmount,
    createdAt: entity.createdAt,
    items: entity.items.map((item) => {
      const variantValues = item.variant.options
        .map((opt) => opt.variantValue.value)
        .join(' - ');
      return {
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        variant: `${item.variant.productMaster.name}, ${variantValues}`,
      };
    }),
  };
}
