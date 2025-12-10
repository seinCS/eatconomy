import { ConfigService } from '@nestjs/config';

/**
 * JWT 설정 검증 및 기본값
 */
export const getJwtConfig = (configService: ConfigService) => {
  const secret = configService.get<string>('JWT_SECRET') || 'dev-secret-key-change-in-production';
  const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';

  // 프로덕션 환경에서는 기본 secret 사용 금지
  if (process.env.NODE_ENV === 'production' && secret === 'dev-secret-key-change-in-production') {
    throw new Error('프로덕션 환경에서는 강력한 JWT_SECRET을 설정해야 합니다.');
  }

  // expiresIn 검증 (예: "7d", "24h", "1h" 형식)
  const validExpiresInPattern = /^\d+[dhms]$/;
  if (!validExpiresInPattern.test(expiresIn)) {
    throw new Error(`JWT_EXPIRES_IN 형식이 올바르지 않습니다. 예: "7d", "24h", "1h"`);
  }

  return {
    secret,
    signOptions: {
      expiresIn,
    },
  } as any; // JwtModuleOptions 타입 호환성을 위한 타입 단언
};

