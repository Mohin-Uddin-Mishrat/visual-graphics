import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { PrismaService } from './module/prisma/prisma.service';
import { JwtGuard } from './common/guards/jwt.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { setupSwagger } from './swagger/swagger.setup';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

function parseCorsOrigins(value?: string) {
  if (!value?.trim()) {
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://visual-graphics-frontend.vercel.app',
      'https://quick-hire-frontend-two.vercel.app',
    ];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    bodyParser: true,
  });

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT') || 5000);
  const host = configService.get<string>('HOST') || '0.0.0.0';
  const corsOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ORIGINS'),
  );

  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);

  app.useGlobalGuards(
    new JwtGuard(reflector, prisma),
    new RolesGuard(reflector),
  );

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);
  await app.listen(port, host);
}
bootstrap();
