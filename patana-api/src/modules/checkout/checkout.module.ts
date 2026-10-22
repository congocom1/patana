import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SharedAuthModule } from '../shared/auth/shared-auth.module';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';

@Module({
  imports: [ConfigModule, SharedAuthModule],
  controllers: [CheckoutController],
  providers: [CheckoutService],
  exports: [CheckoutService],
})
export class CheckoutModule {}
