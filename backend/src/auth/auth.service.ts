import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { KakaoTokenResponse } from './dto/kakao-token-response.dto';
import { KakaoUserInfo } from './dto/kakao-user-info.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 인가 코드로 카카오 액세스 토큰 발급
   * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#토큰-발급
   * 
   * @param code 카카오 인가 코드
   * @returns 카카오 토큰 응답
   * @throws UnauthorizedException 토큰 발급 실패 시
   */
  async getKakaoAccessToken(code: string): Promise<KakaoTokenResponse> {
    const clientId = this.configService.get<string>('KAKAO_CLIENT_ID');
    const redirectUri = this.configService.get<string>('KAKAO_REDIRECT_URI');
    const clientSecret = this.configService.get<string>('KAKAO_CLIENT_SECRET');

    if (!clientId || !redirectUri) {
      console.error('[Kakao Auth] Missing OAuth configuration:', {
        hasClientId: !!clientId,
        hasRedirectUri: !!redirectUri,
      });
      throw new UnauthorizedException('Kakao OAuth configuration is missing');
    }

    // 카카오 토큰 요청 파라미터
    // 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#토큰-발급-요청
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code,
    });

    // Client Secret이 설정되어 있으면 추가 (보안 강화용)
    if (clientSecret) {
      params.append('client_secret', clientSecret);
    }

    console.log('[Kakao Auth] Requesting access token:', {
      clientId: clientId.substring(0, 10) + '...',
      redirectUri,
      hasClientSecret: !!clientSecret,
      codeLength: code?.length || 0,
    });

    try {
      const response = await fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to get access token';
        let errorCode: string | undefined;
        
        console.error('[Kakao Auth] Token request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        try {
          const error = JSON.parse(errorText);
          errorCode = error.error;
          errorMessage = error.error_description || error.error || errorMessage;
          
          // 카카오 에러 코드에 따른 처리
          // 참고: https://developers.kakao.com/docs/latest/ko/rest-api/error-code
          if (errorCode === 'invalid_grant') {
            errorMessage = '인가 코드가 유효하지 않거나 만료되었습니다.';
          } else if (errorCode === 'invalid_client') {
            errorMessage = '클라이언트 인증에 실패했습니다. REST API 키와 Redirect URI를 확인해주세요.';
          } else if (errorCode === 'invalid_request') {
            errorMessage = '잘못된 요청입니다.';
          }
          
          console.error('[Kakao Auth] Parsed error:', { errorCode, errorMessage });
        } catch {
          // JSON 파싱 실패 시 원본 텍스트 사용
          errorMessage = errorText || errorMessage;
          console.error('[Kakao Auth] Failed to parse error response');
        }

        throw new UnauthorizedException(errorMessage);
      }

      const tokenResponse = await response.json();
      console.log('[Kakao Auth] Access token received successfully');
      return tokenResponse;
      
    } catch (error) {
      // 네트워크 에러 등 기타 에러 처리
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[Kakao Auth] Network or unexpected error:', error);
      throw new UnauthorizedException('카카오 인증 서버와 통신 중 오류가 발생했습니다.');
    }
  }

  /**
   * 액세스 토큰으로 카카오 사용자 정보 조회
   * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#사용자-정보-가져오기
   * 
   * @param accessToken 카카오 액세스 토큰
   * @returns 카카오 사용자 정보
   * @throws UnauthorizedException 사용자 정보 조회 실패 시
   */
  async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    console.log('[Kakao Auth] Requesting user info...');
    
    try {
      const response = await fetch('https://kapi.kakao.com/v2/user/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to get user info';
        let errorCode: string | undefined;
        
        console.error('[Kakao Auth] User info request failed:', {
          status: response.status,
          statusText: response.statusText,
        });
        
        try {
          const error = await response.json();
          errorCode = error.code;
          errorMessage = error.msg || error.message || errorMessage;
          
          // 카카오 에러 코드에 따른 처리
          // 참고: https://developers.kakao.com/docs/latest/ko/rest-api/error-code
          if (errorCode === '-401' || response.status === 401) {
            errorMessage = '액세스 토큰이 유효하지 않습니다.';
          } else if (errorCode === '-1') {
            errorMessage = '카카오 서버 오류가 발생했습니다.';
          }
          
          console.error('[Kakao Auth] Parsed error:', { errorCode, errorMessage });
        } catch {
          // JSON 파싱 실패 시 기본 메시지 사용
          errorMessage = `사용자 정보 조회 실패 (HTTP ${response.status})`;
          console.error('[Kakao Auth] Failed to parse error response');
        }

        throw new UnauthorizedException(errorMessage);
      }

      const userInfo = await response.json();
      console.log('[Kakao Auth] User info retrieved:', { 
        id: userInfo.id,
        hasEmail: !!userInfo.kakao_account?.email 
      });
      return userInfo;
      
    } catch (error) {
      // 네트워크 에러 등 기타 에러 처리
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('[Kakao Auth] Network or unexpected error:', error);
      throw new UnauthorizedException('카카오 사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 카카오 사용자 정보로 우리 DB에 사용자 찾기 또는 생성
   * 
   * @param kakaoUserInfo 카카오 사용자 정보
   * @returns 사용자 정보
   */
  async findOrCreateKakaoUser(kakaoUserInfo: KakaoUserInfo) {
    const providerId = kakaoUserInfo.id.toString();
    
    // 카카오 계정 정보 추출 (우선순위: kakao_account > properties)
    const email = kakaoUserInfo.kakao_account?.email;
    const nickname = 
      kakaoUserInfo.kakao_account?.profile?.nickname || 
      kakaoUserInfo.properties?.nickname || 
      '카카오 사용자';
    const avatarUrl = 
      kakaoUserInfo.kakao_account?.profile?.profile_image_url || 
      kakaoUserInfo.kakao_account?.profile?.thumbnail_image_url ||
      kakaoUserInfo.properties?.profile_image ||
      null;

    // 기존 사용자 찾기
    let user = await this.prisma.user.findFirst({
      where: {
        provider: 'kakao',
        providerId,
      },
    });

    if (user) {
      // 기존 사용자 정보 업데이트 (최신 정보로 동기화)
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: email || user.email,
          nickname,
          avatarUrl: avatarUrl || user.avatarUrl,
        },
      });
    } else {
      // 새 사용자 생성
      user = await this.prisma.user.create({
        data: {
          provider: 'kakao',
          providerId,
          email: email || `kakao_${providerId}@kakao.com`,
          nickname,
          avatarUrl,
        },
      });
    }

    return user;
  }

  /**
   * JWT 토큰 발급
   */
  async generateJWT(user: { id: string; email: string }) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  /**
   * JWT 토큰 검증
   */
  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
