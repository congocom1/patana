import { Module } from '@nestjs/common';
import { SharedAuthModule } from '../shared/auth/shared-auth.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [SharedAuthModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
