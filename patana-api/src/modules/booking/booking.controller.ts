import {Body,Controller,Get,Post,Req,UseGuards} from '@nestjs/common';
import {AuthGuard,ActorRequest} from '../auth/auth.guard';
import {BookingService} from './booking.service';
@Controller('bookings')@UseGuards(AuthGuard)export class BookingController{
 constructor(private readonly booking:BookingService){}
 @Get('mine')mine(@Req() req:ActorRequest){return this.booking.mine(req.actor.sub)}
 @Post()create(@Req() req:ActorRequest,@Body() input:unknown){return this.booking.create(req.actor.sub,input)}
}
