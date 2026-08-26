import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProductsModule } from './products/products.module';
import { ProductionModule } from './production/production.module';
import { InventoryLedgerModule } from './inventory-ledger/inventory-ledger.module';
import { ExpenseCategoryModule } from './expense-category/expense-category.module';
import { ExpenseModule } from './expense/expense.module';
import { PosTransactionModule } from './pos-transaction/pos-transaction.module';
import { CategoriesModule } from './categories/categories.module';
import { PaymentModule } from './payment/payment.module';
import { MidtransModule } from './midtrans/midtrans.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TransactionFlowModule } from './transaction-flow/transaction-flow.module';
import { OrderModule } from './order/order.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CartModule } from './cart/cart.module';
import { AddressModule } from './address/address.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReportsModule } from './reports/reports.module';
import { StockTransferModule } from './stock-transfer/stock-transfer.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    /**
     * Batas dasar yang longgar — jaring pengaman, bukan alat pembatas fitur.
     *
     * Satu halaman manajemen bisa menembakkan belasan permintaan sekaligus
     * (tabel, ringkasan, dropdown), dan kasir memakai POS bertubi-tubi. Batas
     * yang ketat di sini akan mengganggu pemakaian normal sebelum sempat
     * menahan penyalahgunaan. Titik yang benar-benar rawan diberi
     * `@Throttle()` sendiri di controllernya.
     */
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    StoresModule,
    UsersModule,
    AuthModule,
    CloudinaryModule,
    ProductsModule,
    ProductionModule,
    InventoryLedgerModule,
    ExpenseCategoryModule,
    ExpenseModule,
    PosTransactionModule,
    CategoriesModule,
    PaymentModule,
    MidtransModule,
    TransactionFlowModule,
    OrderModule,
    DashboardModule,
    CartModule,
    AddressModule,
    WishlistModule,
    WebhooksModule,
    ReportsModule,
    StockTransferModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
