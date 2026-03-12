/*
  Warnings:

  - A unique constraint covering the columns `[usersId]` on the table `employee` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "employee_usersId_key" ON "employee"("usersId");
