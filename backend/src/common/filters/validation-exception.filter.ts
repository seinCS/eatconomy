import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ValidationError } from 'class-validator';

/**
 * Validation 예외 필터
 * class-validator의 ValidationError를 사용자 친화적 메시지로 변환
 */
@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ValidationExceptionFilter.name);

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const exceptionResponse = exception.getResponse();
    let message = exception.message;
    const errors: string[] = [];

    // ValidationError 배열 처리
    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      Array.isArray(exceptionResponse.message)
    ) {
      const validationErrors = exceptionResponse.message as ValidationError[] | string[];

      validationErrors.forEach((error) => {
        if (typeof error === 'string') {
          errors.push(error);
        } else if (typeof error === 'object' && 'constraints' in error) {
          // ValidationError 객체인 경우
          const constraints = (error as ValidationError).constraints;
          if (constraints) {
            Object.values(constraints).forEach((constraint) => {
              errors.push(constraint);
            });
          }
        }
      });

      if (errors.length > 0) {
        message = errors.join(', ');
      }
    }

    const errorLog = {
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errors,
    };

    this.logger.warn(`${request.method} ${request.url}`, JSON.stringify(errorLog));

    response.status(400).json({
      statusCode: 400,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      errors: errors.length > 0 ? errors : undefined,
    });
  }
}

