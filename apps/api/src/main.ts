import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { CsrfService } from './csrf/csrf.service';

async function bootstrap(): Promise<void> {
    const logger = new Logger('Bootstrap');

    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    const config = app.get(ConfigService);
    const csrf = app.get(CsrfService);

    const port = config.get<number>('PORT', 3000);
    const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
    const corsOrigin = config.get<string>('CORS_ORIGIN', 'http://localhost:5173');

    // Security headers
    app.use(helmet());

    // Cookies (يجب أن يسبق CSRF middleware)
    app.use(cookieParser());

    // CSRF — csrf-csrf middleware (double-submit cookie)
    app.use(csrf.protection);

    // CORS — يدعم HttpOnly Cookies
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
        exposedHeaders: [],
    });

    // Global prefix
    app.setGlobalPrefix(apiPrefix);

    // Validation (class-validator)
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: false },
        }),
    );

    app.enableShutdownHooks();

    await app.listen(port);

    logger.log(`Prince Net API running on http://localhost:${port}/${apiPrefix}`);
    logger.log(`CORS origin: ${corsOrigin}`);
    logger.log(`Environment: ${config.get<string>('NODE_ENV', 'development')}`);
}

bootstrap().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
});
