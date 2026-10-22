import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.enableCors({
    origin: [
      process.env.CUSTOMER_ORIGIN,
      process.env.OWNER_ORIGIN,
    ].filter((v): v is string => Boolean(v)),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Patana API')
    .setDescription('Property booking platform API')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('catalog', 'Property and unit management')
    .addTag('bookings', 'Booking management')
    .addTag('owner', 'Owner dashboard')
    .addTag('checkout', 'Payment processing')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(Number(process.env.PORT) || 4000);
}
void bootstrap();