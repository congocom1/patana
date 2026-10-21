import {Body,Controller,Get,Post,Req,UseGuards} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthGuard,ActorRequest} from './auth.guard';
@Controller('auth')export class AuthController{constructor(private readonly auth:AuthService){}
 @Post('register')register(@Body() input:{email:string;fullName:string;password:string}){return this.auth.register(input)}
 @Post('login')login(@Body() input:{email:string;password:string}){return this.auth.login(input)}
 @Get('me')@UseGuards(AuthGuard)me(@Req() req:ActorRequest){return this.auth.me(req.actor.sub)}
}
