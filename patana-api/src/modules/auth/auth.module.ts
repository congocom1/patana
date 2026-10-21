import {Module} from '@nestjs/common';
import {JwtModule} from '@nestjs/jwt';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {AuthGuard} from './auth.guard';
const secret=process.env.JWT_SECRET;
if(!secret||secret.length<32)throw new Error('JWT_SECRET must be configured with at least 32 characters');
@Module({imports:[JwtModule.register({secret,signOptions:{issuer:'patana-api',audience:'patana-client',algorithm:'HS256'}})],controllers:[AuthController],providers:[AuthService,AuthGuard],exports:[JwtModule,AuthGuard]})export class AuthModule{}
