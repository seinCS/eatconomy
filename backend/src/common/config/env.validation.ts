import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, validateSync } from 'class-validator';

/**
 * 환경 변수 타입 정의
 */
enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * 환경 변수 스키마
 */
class EnvironmentVariables {
  @IsEnum(NodeEnv)
  @IsOptional()
  NODE_ENV?: NodeEnv;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  JWT_SECRET?: string; // 개발 환경에서는 기본값 사용

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN?: string;

  @IsString()
  @IsNotEmpty()
  KAKAO_CLIENT_ID!: string;

  @IsString()
  @IsOptional()
  KAKAO_CLIENT_SECRET?: string;

  @IsString()
  @IsNotEmpty()
  KAKAO_REDIRECT_URI!: string;

  @IsString()
  @IsOptional()
  FRONTEND_URL?: string;

  @IsString()
  @IsOptional()
  PORT?: string;
}

/**
 * 환경 변수 검증
 */
export function validate(config: Record<string, unknown>) {
  // 빈 문자열을 undefined로 변환 (선택사항 필드 처리)
  const cleanedConfig: Record<string, unknown> = {};
  const optionalFields = ['JWT_SECRET', 'FRONTEND_URL', 'JWT_EXPIRES_IN', 'KAKAO_CLIENT_SECRET', 'PORT', 'NODE_ENV'];
  
  for (const [key, value] of Object.entries(config)) {
    // 선택사항 필드가 빈 문자열이거나 null이면 undefined로 설정
    if (optionalFields.includes(key) && (value === '' || value === null || value === undefined)) {
      cleanedConfig[key] = undefined;
    } else {
      cleanedConfig[key] = value;
    }
  }

  const validatedConfig = plainToInstance(EnvironmentVariables, cleanedConfig, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  // 선택사항 필드가 빈 문자열인 경우 undefined로 설정 (plainToInstance 후에도 처리)
  if (validatedConfig.JWT_SECRET === '' || validatedConfig.JWT_SECRET === null) {
    (validatedConfig as any).JWT_SECRET = undefined;
  }
  if (validatedConfig.FRONTEND_URL === '' || validatedConfig.FRONTEND_URL === null) {
    (validatedConfig as any).FRONTEND_URL = undefined;
  }

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: true, // 선택사항 필드는 검증에서 제외
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const missingVars = errors
      .map((error) => {
        const property = error.property;
        const constraints = Object.values(error.constraints || {}).join(', ');
        return `${property}: ${constraints}`;
      })
      .join('; ');
    
    throw new Error(`환경 변수 검증 실패: ${missingVars}`);
  }

  return validatedConfig;
}

