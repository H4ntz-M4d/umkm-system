/*
  Warnings:

  - You are about to drop the column `email` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `usersId` on the `employee` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `employee` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `employee` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_usersId_fkey";

-- DropIndex
DROP INDEX "employee_email_key";

-- DropIndex
DROP INDEX "employee_usersId_key";

-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "userId" BIGINT;

-- AlterTable
ALTER TABLE "employee" DROP COLUMN "email",
DROP COLUMN "usersId",
ADD COLUMN     "userId" BIGINT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "name";

-- CreateIndex
CREATE UNIQUE INDEX "customer_userId_key" ON "customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
