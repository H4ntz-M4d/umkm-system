-- CreateTable
CREATE TABLE "expense_proof" (
    "id" BIGSERIAL NOT NULL,
    "expenseId" BIGINT NOT NULL,
    "image" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_proof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expense_proof_expenseId_idx" ON "expense_proof"("expenseId");

-- AddForeignKey
ALTER TABLE "expense_proof" ADD CONSTRAINT "expense_proof_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

