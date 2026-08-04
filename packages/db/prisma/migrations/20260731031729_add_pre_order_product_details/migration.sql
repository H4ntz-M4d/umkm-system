-- CreateTable
CREATE TABLE "product_pre_order" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "quotaTarget" INTEGER NOT NULL,
    "maxQuota" INTEGER NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_pre_order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_pre_order_productMasterId_key" ON "product_pre_order"("productMasterId");

-- AddForeignKey
ALTER TABLE "product_pre_order" ADD CONSTRAINT "product_pre_order_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;
