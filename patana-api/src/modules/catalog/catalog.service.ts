import {BadRequestException,ForbiddenException,Injectable} from '@nestjs/common';
import {PrismaService} from '../shared/prisma.service';
import {z} from 'zod';
const propertyInput=z.object({type:z.enum(['hotel','apartment']),name:z.string().min(2).max(150),city:z.string().min(2).max(100),address:z.string().min(5).max(255),description:z.string().max(3000).optional(),imageUrl:z.string().url().max(1000).optional()}).strict();
const unitInput=z.object({propertyId:z.string().uuid(),name:z.string().min(2).max(150),capacity:z.number().int().min(1).max(100),pricePerNight:z.number().positive().max(100000),status:z.enum(['active','inactive']).default('active')}).strict();
@Injectable()export class CatalogService{constructor(private readonly db:PrismaService){}
 async properties(city?:string){if(city&&city.length>120)throw new BadRequestException('Search too long');const result=await this.db.property.findMany({where:city?{city:{contains:city,mode:'insensitive'}}:{},include:{units:{where:{status:'active'}}},take:100});return result.map(p=>({...p,units:p.units.map(u=>({...u,pricePerNight:Number(u.pricePerNight)}))}))}
 async mine(userId:string){return this.db.property.findMany({where:{owner:{userId}},include:{units:true}})}
 async createProperty(userId:string,payload:unknown){const parsed=propertyInput.safeParse(payload);if(!parsed.success)throw new BadRequestException('Invalid property');const owner=await this.db.owner.findUnique({where:{userId}});if(!owner)throw new ForbiddenException('Owner registration required');return this.db.property.create({data:{...parsed.data,ownerId:owner.id}})}
 async createUnit(userId:string,payload:unknown){const parsed=unitInput.safeParse(payload);if(!parsed.success)throw new BadRequestException('Invalid unit');const {propertyId,...rest}=parsed.data;const property=await this.db.property.findFirst({where:{id:propertyId,owner:{userId}}});if(!property)throw new ForbiddenException('Not your property');return this.db.unit.create({data:{...rest,propertyId}})}
}
