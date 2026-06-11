-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'KASIR', 'GUDANG', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'NONACTIVE', 'DRAFT');

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('MADE_TO_ORDER', 'PRE_ORDER', 'READY_STOCK');

-- CreateEnum
CREATE TYPE "InventoryItemType" AS ENUM ('PRODUCT_VARIANT');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('PRODUCTION', 'POS', 'ONLINE_ORDER', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ProductionType" AS ENUM ('RESTOCK', 'MADE_TO_ORDER', 'BE_SPOKE', 'PRE_ORDER');

-- CreateEnum
CREATE TYPE "ProductionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentChannel" AS ENUM ('CASH', 'MIDTRANS', 'MANUAL', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "CashType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "CashSource" AS ENUM ('POS', 'ORDER', 'EXPENSE', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "PosStatus" AS ENUM ('DRAFT', 'PARKED', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "store" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "refreshToken" TEXT,
    "slug" VARCHAR(255),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(100) NOT NULL,
    "status" BOOLEAN NOT NULL DEFAULT true,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_master" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "categoryId" BIGINT,
    "slug" VARCHAR(255) NOT NULL,
    "useVariant" BOOLEAN NOT NULL DEFAULT false,
    "type" "ProductType" NOT NULL DEFAULT 'MADE_TO_ORDER',
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_master_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_image" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "image" TEXT NOT NULL,

    CONSTRAINT "product_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "sku" VARCHAR(100) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "cost" DECIMAL(18,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "image" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_stock" (
    "id" BIGSERIAL NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "stock" INTEGER NOT NULL,
    "reserved_stock" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variant_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_type" (
    "id" BIGSERIAL NOT NULL,
    "productMasterId" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "product_variant_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_value" (
    "id" BIGSERIAL NOT NULL,
    "variantTypeId" BIGINT NOT NULL,
    "value" VARCHAR(100) NOT NULL,

    CONSTRAINT "product_variant_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant_option" (
    "id" BIGSERIAL NOT NULL,
    "productVariantId" BIGINT NOT NULL,
    "variantValueId" BIGINT NOT NULL,

    CONSTRAINT "product_variant_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "image" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" BIGINT,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "phone" VARCHAR(15),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "image" VARCHAR(255),
    "userId" BIGINT NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_ledger" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "itemType" "InventoryItemType" NOT NULL,
    "itemId" BIGINT NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceId" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "producedVariantId" BIGINT,
    "quantityProduced" INTEGER NOT NULL,
    "type" "ProductionType" NOT NULL DEFAULT 'RESTOCK',
    "status" "ProductionStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_category" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(100) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" BIGSERIAL NOT NULL,
    "storeId" BIGINT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "categoryId" BIGINT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_item" (
    "id" BIGSERIAL NOT NULL,
    "expenseId" BIGINT NOT NULL,
    "itemName" VARCHAR(100),
    "quantity" INTEGER NOT NULL,
    "unit" VARCHAR(100) NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "subtotal" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "expense_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" BIGSERIAL NOT NULL,
    "branchId" BIGINT NOT NULL,
    "customerId" BIGINT,
    "orderId" VARCHAR(100) NOT NULL,
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
CREATE TABLE "be_spoke_details" (
    "id" BIGSERIAL NOT NULL,
    "productionId" BIGINT NOT NULL,
    "customerId" BIGINT,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "quotedPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "be_spoke_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" BIGSERIAL NOT NULL,
    "orderId" BIGINT,
    "beSpokeDetailsId" BIGINT,
    "recipientName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "addressLine" TEXT NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "courier" VARCHAR(100) NOT NULL,
    "shippingCost" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
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
    "transId" VARCHAR(100) NOT NULL,
    "paymentMethodId" BIGINT,
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
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_master_slug_key" ON "product_master"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_key" ON "product_variant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_productMasterId_idx" ON "product_variant"("productMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_stock_productVariantId_key" ON "product_variant_stock"("productVariantId");

-- CreateIndex
CREATE INDEX "product_variant_type_productMasterId_idx" ON "product_variant_type"("productMasterId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_type_productMasterId_name_key" ON "product_variant_type"("productMasterId", "name");

-- CreateIndex
CREATE INDEX "product_variant_value_variantTypeId_idx" ON "product_variant_value"("variantTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_value_variantTypeId_value_key" ON "product_variant_value"("variantTypeId", "value");

-- CreateIndex
CREATE INDEX "product_variant_option_productVariantId_idx" ON "product_variant_option"("productVariantId");

-- CreateIndex
CREATE INDEX "product_variant_option_variantValueId_idx" ON "product_variant_option"("variantValueId");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_option_productVariantId_variantValueId_key" ON "product_variant_option"("productVariantId", "variantValueId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_userId_key" ON "customer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_userId_key" ON "employee"("userId");

-- CreateIndex
CREATE INDEX "inventory_ledger_storeId_itemType_itemId_idx" ON "inventory_ledger"("storeId", "itemType", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "order_orderId_key" ON "order"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "be_spoke_details_productionId_key" ON "be_spoke_details"("productionId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_orderId_key" ON "shipment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_beSpokeDetailsId_key" ON "shipment"("beSpokeDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_code_key" ON "payment_method"("code");

-- CreateIndex
CREATE UNIQUE INDEX "pos_transaction_transId_key" ON "pos_transaction"("transId");

-- CreateIndex
CREATE UNIQUE INDEX "pos_transaction_item_posTransactionId_productVariantId_key" ON "pos_transaction_item"("posTransactionId", "productVariantId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_master" ADD CONSTRAINT "product_master_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_image" ADD CONSTRAINT "product_image_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_stock" ADD CONSTRAINT "product_variant_stock_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_type" ADD CONSTRAINT "product_variant_type_productMasterId_fkey" FOREIGN KEY ("productMasterId") REFERENCES "product_master"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_value" ADD CONSTRAINT "product_variant_value_variantTypeId_fkey" FOREIGN KEY ("variantTypeId") REFERENCES "product_variant_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant_option" ADD CONSTRAINT "product_variant_option_variantValueId_fkey" FOREIGN KEY ("variantValueId") REFERENCES "product_variant_value"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_ledger" ADD CONSTRAINT "inventory_ledger_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production" ADD CONSTRAINT "production_producedVariantId_fkey" FOREIGN KEY ("producedVariantId") REFERENCES "product_variant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expense_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_item" ADD CONSTRAINT "expense_item_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "be_spoke_details" ADD CONSTRAINT "be_spoke_details_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "be_spoke_details" ADD CONSTRAINT "be_spoke_details_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_beSpokeDetailsId_fkey" FOREIGN KEY ("beSpokeDetailsId") REFERENCES "be_spoke_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction" ADD CONSTRAINT "pos_transaction_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_method"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_item" ADD CONSTRAINT "pos_transaction_item_posTransactionId_fkey" FOREIGN KEY ("posTransactionId") REFERENCES "pos_transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_item" ADD CONSTRAINT "pos_transaction_item_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
