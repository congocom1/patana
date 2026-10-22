import { Module } from '@nestjs/common';
import { PrismaModule } from '../shared/prisma.module';
import { SharedAuthModule } from '../shared/auth/shared-auth.module';
import { OwnerController } from './owner.controller';
import { OwnerGuard } from './owner.guard';

@Module({
  imports: [PrismaModule, SharedAuthModule],
  controllers: [OwnerController],
  providers: [OwnerGuard],
})
export class OwnerModule {}
