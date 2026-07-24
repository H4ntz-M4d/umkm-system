-- DropForeignKey
ALTER TABLE "pos_transaction_item" DROP CONSTRAINT "pos_transaction_item_posTransactionId_fkey";

-- AddForeignKey
ALTER TABLE "pos_transaction_item" ADD CONSTRAINT "pos_transaction_item_posTransactionId_fkey" FOREIGN KEY ("posTransactionId") REFERENCES "pos_transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
