import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {AuthGuard} from './auth.guard';
@Module({imports:[JwtModule.register({secret:process.env.JWT_SECRET||'INSECURE_DEV_ONLY_CHANGE_ME',signOptions:{issuer:'patana-api'}})],controllers:[AuthController],providers:[AuthService,AuthGuard],exports:[JwtModule,AuthGuard]})export class AuthModule{}
