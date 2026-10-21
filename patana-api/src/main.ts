import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {ValidationPipe} from '@nestjs/common';
import helmet from 'helmet';
import {AppModule} from './app.module';
async function bootstrap(){
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET (32+ characters) is required');
 if(process.env.NODE_ENV==='production'&&(!process.env.CUSTOMER_ORIGIN||!process.env.OWNER_ORIGIN))throw new Error('Production allowed origins are required');
 const app=await NestFactory.create(AppModule,{rawBody:true});
 app.use(helmet());
 app.setGlobalPrefix('api');
 app.enableCors({origin:[process.env.CUSTOMER_ORIGIN||'http://localhost:5173',process.env.OWNER_ORIGIN||'http://localhost:5174'],methods:['GET','POST','PUT','PATCH','DELETE'],allowedHeaders:['Content-Type','Authorization']});
 app.useGlobalPipes(new ValidationPipe({transform:true,whitelist:true,forbidNonWhitelisted:true}));
 await app.listen(Number(process.env.PORT)||4000);
}
void bootstrap();
