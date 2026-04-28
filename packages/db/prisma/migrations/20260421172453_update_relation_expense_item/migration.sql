-- DropForeignKey
ALTER TABLE "expense_item" DROP CONSTRAINT "expense_item_expenseId_fkey";

-- AddForeignKey
ALTER TABLE "expense_item" ADD CONSTRAINT "expense_item_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
