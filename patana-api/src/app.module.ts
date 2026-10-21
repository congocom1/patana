import {Module} from '@nestjs/common';
import {CatalogModule} from './modules/catalog/catalog.module';
import {BookingModule} from './modules/booking/booking.module';
import {CheckoutModule} from './modules/checkout/checkout.module';
import {HealthController} from './modules/shared/health.controller';
@Module({imports:[CatalogModule,BookingModule,CheckoutModule],controllers:[HealthController]})export class AppModule{}
