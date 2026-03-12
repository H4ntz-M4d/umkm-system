-- DropForeignKey
ALTER TABLE "employee" DROP CONSTRAINT "employee_usersId_fkey";

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_usersId_fkey" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
