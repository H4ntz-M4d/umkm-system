-- CreateTable
CREATE TABLE "password_reset_code" (
    "id" BIGSERIAL NOT NULL,
    "userId" BIGINT NOT NULL,
    "codeHash" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_reset_code_userId_expiresAt_idx" ON "password_reset_code"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "password_reset_code" ADD CONSTRAINT "password_reset_code_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
