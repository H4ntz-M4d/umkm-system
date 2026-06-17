-- DropForeignKey
ALTER TABLE "bank_account" DROP CONSTRAINT "bank_account_paymentMethodId_fkey";

-- AddForeignKey
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE CASCADE;
