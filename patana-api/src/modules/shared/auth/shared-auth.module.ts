import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../../auth/auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { issuer: 'patana-api' },
    }),
  ],
  providers: [AuthGuard],
  exports: [JwtModule, AuthGuard],
})
export class SharedAuthModule {}