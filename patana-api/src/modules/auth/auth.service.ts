import {BadRequestException,ConflictException,Injectable,UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {PrismaService} from '../shared/prisma.service';
import {randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
@Injectable() export class AuthService {
 constructor(private readonly db:PrismaService,private readonly jwt:JwtService){}
 private hash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex')}
 private matches(password:string,stored:string){const [salt,digest]=stored.split(':');if(!salt||!digest||digest.length!==128)return false;return timingSafeEqual(Buffer.from(digest,'hex'),scryptSync(password,salt,64))}
 private token(id:string,role:string){return {accessToken:this.jwt.sign({sub:id,role},{expiresIn:'12h'}),tokenType:'Bearer'}}
 async register(input:{email:string;fullName:string;password:string}){
 const email=input.email?.trim().toLowerCase();if(!email||!/^\S+@\S+\.\S+$/.test(email)||!input.fullName?.trim()||!input.password||input.password.length<12||input.password.length>128)throw new BadRequestException('Valid name, email and password of 12–128 characters are required');
 if(await this.db.user.findUnique({where:{email}}))throw new ConflictException('Email already registered');
 try{const user=await this.db.user.create({data:{email,fullName:input.fullName.trim(),passwordHash:this.hash(input.password),role:'customer'}});return this.token(user.id,user.role)}
 catch(error){throw new ConflictException('Account could not be created')}
 }
 async login(input:{email:string;password:string}){const user=await this.db.user.findUnique({where:{email:input.email?.trim().toLowerCase()||''}});if(!user?.passwordHash||!input.password||!this.matches(input.password,user.passwordHash))throw new UnauthorizedException('Invalid credentials');return this.token(user.id,user.role)}
 async me(id:string){const user=await this.db.user.findUnique({where:{id},select:{id:true,email:true,fullName:true,role:true}});if(!user)throw new UnauthorizedException();return user}
}
