import {Injectable} from '@nestjs/common';
import {PrismaClient} from '@prisma/client';
@Injectable()export class CatalogService{private readonly prisma=new PrismaClient();async properties(city?:string){const properties=await this.prisma.property.findMany({where:city?{city:{contains:city,mode:'insensitive'}}:{},include:{units:true},take:100});return properties.map(p=>({...p,units:p.units.map(u=>({...u,pricePerNight:Number(u.pricePerNight)}))}))}}
