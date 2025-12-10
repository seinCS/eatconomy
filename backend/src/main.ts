import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log'], // 기본 logger도 사용 (Winston과 함께)
    });
    
    // Winston Logger를 전역으로 설정 (사용 가능한 경우)
    try {
      const winstonLogger = app.get(WINSTON_MODULE_NEST_PROVIDER);
      app.useLogger(winstonLogger);
    } catch (error) {
      console.warn('Winston logger not available, using default logger');
    }
    
    // CORS 설정
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });

    // 전역 예외 필터 설정 (순서 중요)
    // HttpExceptionFilter가 ThrottlerException도 처리함
    app.useGlobalFilters(
      new ValidationExceptionFilter(),
      new HttpExceptionFilter(),
    );

    // 전역 Validation Pipe 설정
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
          return new BadRequestException(errors);
        },
      }),
    );

    // API prefix 설정
    app.setGlobalPrefix('api');

    const port = process.env.PORT || 3001;
    await app.listen(port);
    
    console.log(`🚀 Backend server is running on: http://localhost:${port}/api`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}
bootstrap();
