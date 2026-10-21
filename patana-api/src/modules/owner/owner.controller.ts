import {BadRequestException,Body,Controller,Get,Post,Req,UseGuards} from '@nestjs/common';
import {PrismaService} from '../shared/prisma.service';
import {AuthGuard,ActorRequest} from '../auth/auth.guard';
@Controller('owner')@UseGuards(AuthGuard)export class OwnerController{constructor(private readonly db:PrismaService){}
 @Get('me')me(@Req() req:ActorRequest){return this.db.owner.findUnique({where:{userId:req.actor.sub},select:{id:true,businessName:true,verificationStatus:true}})}
 @Post('register')async register(@Req() req:ActorRequest,@Body() input:{businessName?:string}){const name=input.businessName?.trim();if(!name||name.length<2||name.length>150)throw new BadRequestException('Business name must be 2–150 characters');return this.db.owner.upsert({where:{userId:req.actor.sub},create:{userId:req.actor.sub,businessName:name},update:{}})}
 @Get('bookings')async bookings(@Req() req:ActorRequest){return this.db.booking.findMany({where:{unit:{property:{owner:{userId:req.actor.sub}}}},select:{id:true,status:true,checkIn:true,checkOut:true,guests:true,totalPrice:true,unit:{select:{name:true,property:{select:{name:true}}}}},orderBy:{createdAt:'desc'}})}
}
