import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));

  app.setGlobalPrefix('api/v1', { exclude: ['health'] });
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:8081'],
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Bopay backend running on port ${port}`);
}
bootstrap();
