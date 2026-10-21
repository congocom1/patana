import {CanActivate,ExecutionContext,Injectable,UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import type {Request} from 'express';
@Injectable() export class AuthGuard implements CanActivate {constructor(private readonly jwt:JwtService){}
 async canActivate(ctx:ExecutionContext){const req=ctx.switchToHttp().getRequest<Request&{actor?:{sub:string;role:string}}>();const header=req.headers.authorization||'';if(!header.startsWith('Bearer '))throw new UnauthorizedException();try{const actor=await this.jwt.verifyAsync<{sub:string;role:string}>(header.slice(7));if(!actor.sub)throw new Error('Missing user');req.actor=actor;return true}catch{throw new UnauthorizedException()}}
}
export type ActorRequest=Request&{actor:{sub:string;role:string}};
