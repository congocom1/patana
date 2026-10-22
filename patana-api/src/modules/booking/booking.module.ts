import { Module } from '@nestjs/common';
import { SharedAuthModule } from '../shared/auth/shared-auth.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [SharedAuthModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
