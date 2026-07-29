/*
  Warnings:

  - A unique constraint covering the columns `[customerId]` on the table `cart` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cart_customerId_key" ON "cart"("customerId");

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist" ADD CONSTRAINT "wishlist_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
