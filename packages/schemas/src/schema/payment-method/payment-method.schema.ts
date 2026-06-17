import z from "zod";

export const PaymentChannelEnum = z.enum(["CASH", "BANK_TRANSFER", "MIDTRANS"]);

export const BankAccountSchema = z.object({
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
})

export const PaymentMethodSchema = z.object({
  name: z.string().min(3, "Nama minimal memiliki 3 karakter"),
  channel: PaymentChannelEnum,
  isActive: z.boolean(),
  bankAccount: BankAccountSchema.optional() 
});

export type PaymentMethodSchemaInput = z.infer<typeof PaymentMethodSchema>
