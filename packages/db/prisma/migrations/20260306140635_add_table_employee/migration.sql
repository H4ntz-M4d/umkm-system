-- CreateTable
CREATE TABLE "employee" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usersId" BIGINT NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_email_key" ON "employee"("email");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
