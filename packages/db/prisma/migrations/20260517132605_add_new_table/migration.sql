-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CASH', 'MIDTRANS', 'MANUAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "CashType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashSource" AS ENUM ('POS', 'ORDER', 'EXPENSE');

-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('ACTIVE', 'PARKED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "order" (
    "id" BIGSERIAL NOT NULL,
    "branchId" BIGINT NOT NULL,
    "customerId" BIGINT,
    "paymentMethodId" BIGINT NOT NULL,
    "paymentGatewayRef" VARCHAR(255),
    "status" "OrderStatus" NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_shipment" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT NOT NULL,
    "recipientName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "courier" VARCHAR(100) NOT NULL,
    "shippingCost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "channel" "PaymentChannel" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transaction" (
    "id" BIGSERIAL NOT NULL,
    "branchId" BIGINT NOT NULL,
    "type" "CashType" NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "source" "CashSource" NOT NULL,
    "referenceId" BIGINT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transaction" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "cashierId" BIGINT NOT NULL,
    "paymentMethodId" BIGINT NOT NULL,
    "status" "PosStatus" NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transaction_item" (
    "id" BIGSERIAL NOT NULL,
    "posTransactionId" BIGINT NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "pos_transaction_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_shipment_orderId_key" ON "order_shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_code_key" ON "payment_method"("code");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_shipment" ADD CONSTRAINT "order_shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_item" ADD CONSTRAINT "pos_transaction_item_posTransactionId_fkey" FOREIGN KEY ("posTransactionId") REFERENCES "pos_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_item" ADD CONSTRAINT "pos_transaction_item_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
