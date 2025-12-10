import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';

/**
 * 전역 HTTP 예외 필터
 * 모든 HTTP 예외를 일관된 형식으로 처리
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    // HttpException 처리
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      // ThrottlerException 처리 (Rate Limiting)
      if (exception instanceof ThrottlerException) {
        status = HttpStatus.TOO_MANY_REQUESTS;
        message = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        error = 'Too Many Requests';
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || exception.name;
      }
    } 
    // Prisma 에러 처리
    else if (exception && typeof exception === 'object' && 'code' in exception) {
      const prismaError = exception as any;
      
      // Prisma 에러 코드별 처리
      switch (prismaError.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          message = 'Unique constraint violation';
          error = 'Conflict';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          error = 'Not Found';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Database error';
          error = 'Database Error';
      }
    }
    // 기타 에러 처리
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // 에러 로깅
    const errorLog = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      ...(process.env.NODE_ENV === 'development' && {
        stack: exception instanceof Error ? exception.stack : undefined,
      }),
    };

    // 5xx 에러는 에러 레벨로, 그 외는 경고 레벨로 로깅
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url}`, JSON.stringify(errorLog));
    } else {
      this.logger.warn(`${request.method} ${request.url}`, JSON.stringify(errorLog));
    }

    // 클라이언트 응답 (프로덕션에서는 상세 정보 제한)
    const responseBody: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // 개발 환경에서만 에러 상세 정보 포함
    if (process.env.NODE_ENV === 'development') {
      responseBody.error = error;
      if (exception instanceof Error && exception.stack) {
        responseBody.stack = exception.stack;
      }
    }

    response.status(status).json(responseBody);
  }
}

