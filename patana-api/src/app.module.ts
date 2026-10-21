import {Module} from '@nestjs/common';
import {CatalogModule} from './modules/catalog/catalog.module';
import {BookingModule} from './modules/booking/booking.module';
import {CheckoutModule} from './modules/checkout/checkout.module';
import {AuthModule} from './modules/auth/auth.module';
import {OwnerModule} from './modules/owner/owner.module';
import {PrismaModule} from './modules/shared/prisma.module';
import {HealthController} from './modules/shared/health.controller';
@Module({imports:[PrismaModule,AuthModule,OwnerModule,CatalogModule,BookingModule,CheckoutModule],controllers:[HealthController]})export class AppModule{}
