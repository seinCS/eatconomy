import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    // JWT_SECRET이 없으면 개발용 기본값 사용 (jwt.config.ts와 일관성 유지)
    const secret = configService.get<string>('JWT_SECRET') || 'dev-secret-key-change-in-production';
    
    // 프로덕션 환경에서는 강력한 secret 필수
    if (process.env.NODE_ENV === 'production' && secret === 'dev-secret-key-change-in-production') {
      throw new Error('프로덕션 환경에서는 강력한 JWT_SECRET을 설정해야 합니다.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * JWT 페이로드 검증
   * 
   * @param payload JWT 페이로드 (sub: userId, email: 사용자 이메일)
   * @returns 사용자 정보
   * @throws UnauthorizedException 사용자를 찾을 수 없는 경우
   */
  async validate(payload: { sub: string; email: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

