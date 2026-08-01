import { CustomerAddress } from '@repo/db';

export function toCustomerAddressResponse(entity: CustomerAddress) {
  return {
    id: String(entity.id),
    recipientName: entity.recipientName,
    phone: entity.phone,
    addressLine: entity.addressLine,
    city: entity.city,
    province: entity.province,
    isDefault: entity.isDefault,
  };
}
