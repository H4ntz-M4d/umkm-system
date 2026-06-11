/*
  Warnings:

  - Added the required column `targetDate` to the `production` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "production" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "targetDate" TIMESTAMP(3) NOT NULL;
