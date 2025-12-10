import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Winston 로깅 설정
 */
export const winstonConfig: WinstonModuleOptions = {
  transports: [
    // 콘솔 출력
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}`;
        }),
      ),
    }),
    // 파일 출력 (프로덕션 환경에서만)
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.json(),
            ),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  // 로그 레벨 설정
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
};

