import 'reflect-metadata';
import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
async function bootstrap(){
 if(process.env.NODE_ENV==='production'&&(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32))throw new Error('JWT_SECRET (32+ characters) is required in production');
 const app=await NestFactory.create(AppModule);
 app.setGlobalPrefix('api');
 app.enableCors({origin:[process.env.CUSTOMER_ORIGIN||'http://localhost:5173',process.env.OWNER_ORIGIN||'http://localhost:5174']});
 await app.listen(Number(process.env.PORT)||4000);
}
void bootstrap();
