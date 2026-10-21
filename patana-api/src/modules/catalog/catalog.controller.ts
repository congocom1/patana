import {Controller,Get,Query} from '@nestjs/common';
import {CatalogService} from './catalog.service';
@Controller('catalog')export class CatalogController{constructor(private readonly catalog:CatalogService){}@Get('properties')properties(@Query('city') city?:string){return this.catalog.properties(city)}}
