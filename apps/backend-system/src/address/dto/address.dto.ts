import { createZodDto } from 'nestjs-zod';
import { CustomerAddressSchema, UpdateCustomerAddressSchema } from '@repo/schemas';

export class CustomerAddressDto extends createZodDto(CustomerAddressSchema) {}
export class UpdateCustomerAddressDto extends createZodDto(
  UpdateCustomerAddressSchema,
) {}
