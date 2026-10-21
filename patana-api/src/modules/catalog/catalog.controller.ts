import {Body,Controller,Get,Post,Query,Req,UseGuards} from '@nestjs/common';
import {CatalogService} from './catalog.service';
import {AuthGuard,ActorRequest} from '../auth/auth.guard';
@Controller('catalog')export class CatalogController{constructor(private readonly catalog:CatalogService){}
 @Get('properties')properties(@Query('city') city?:string){return this.catalog.properties(city)}
 @Get('mine')@UseGuards(AuthGuard)mine(@Req() req:ActorRequest){return this.catalog.mine(req.actor.sub)}
 @Post('properties')@UseGuards(AuthGuard)createProperty(@Req() req:ActorRequest,@Body() input:unknown){return this.catalog.createProperty(req.actor.sub,input)}
 @Post('units')@UseGuards(AuthGuard)createUnit(@Req() req:ActorRequest,@Body() input:unknown){return this.catalog.createUnit(req.actor.sub,input)}
}
