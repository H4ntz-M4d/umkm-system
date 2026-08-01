-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PACKAGING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable
ALTER TABLE "shipment" ADD COLUMN     "status" "ShipmentStatus" DEFAULT 'PACKAGING',
ADD COLUMN     "trackingNumber" VARCHAR(100);
