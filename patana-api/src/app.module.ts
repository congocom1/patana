import {Module} from '@nestjs/common';
import {ThrottlerModule} from '@nestjs/throttler';
import {CatalogModule} from './modules/catalog/catalog.module';
import {BookingModule} from './modules/booking/booking.module';
import {CheckoutModule} from './modules/checkout/checkout.module';
import {AuthModule} from './modules/auth/auth.module';
import {OwnerModule} from './modules/owner/owner.module';
import {PrismaModule} from './modules/shared/prisma.module';
import {HealthController} from './modules/shared/health.controller';
import {APP_GUARD} from '@nestjs/core';
import {ThrottlerGuard} from '@nestjs/throttler';
@Module({imports:[ThrottlerModule.forRoot([{ttl:60000,limit:60}]),PrismaModule,AuthModule,OwnerModule,CatalogModule,BookingModule,CheckoutModule],controllers:[HealthController],providers:[{provide:APP_GUARD,useClass:ThrottlerGuard}]})export class AppModule{}
