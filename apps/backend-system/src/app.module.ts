import { Module } from '@nestjs/common';
import { StoresModule } from './stores/stores.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ProductsModule } from './products/products.module';
import { MaterialModule } from './material/material.module';
import { ProductionModule } from './production/production.module';
import { InventoryLedgerModule } from './inventory-ledger/inventory-ledger.module';

@Module({
  imports: [
    StoresModule,
    UsersModule,
    AuthModule,
    CloudinaryModule,
    ProductsModule,
    MaterialModule,
    ProductionModule,
    InventoryLedgerModule,
  ],
})
export class AppModule {}
