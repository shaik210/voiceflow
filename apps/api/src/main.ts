import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Set global API prefix (/api)
  app.setGlobalPrefix('api');

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Configure Express reverse proxy trust settings for accurate client IP resolution behind load balancers/proxies
  // Standard deployment assumption: 1 hop in front of the application (e.g. Nginx, Docker ingress, ALB).
  // Can be configured through TRUST_PROXY environment variable.
  const trustProxySetting = process.env.TRUST_PROXY || '1';
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set(
    'trust proxy',
    trustProxySetting === 'true'
      ? true
      : trustProxySetting === 'false'
      ? false
      : !isNaN(Number(trustProxySetting))
      ? Number(trustProxySetting)
      : trustProxySetting,
  );

  // Attach global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = parseInt(process.env.PORT || '4000', 10);
  await app.listen(port);
  logger.log(`[VoiceFlow NestJS API] Server running on http://localhost:${port}/api`);
}

bootstrap();
