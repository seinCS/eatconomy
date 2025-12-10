import { Controller, Get, Query, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 카카오 OAuth 콜백 처리
   * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
   * Rate Limiting: 인증 관련 엔드포인트는 더 엄격하게 제한
   * 
   * 보안: state 파라미터를 통한 CSRF 공격 방지
   */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('kakao/callback')
  async kakaoCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Query('error_description') errorDescription: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // 로깅: 요청 파라미터 확인
    console.log('[Kakao Callback] Received parameters:', {
      hasCode: !!code,
      hasState: !!state,
      hasError: !!error,
      errorDescription,
    });

    // 카카오에서 에러를 반환한 경우
    // 참고: https://developers.kakao.com/docs/latest/ko/rest-api/error-code
    if (error) {
      console.error('[Kakao Callback] Error from Kakao:', { error, errorDescription });
      
      // 카카오 에러 코드를 사용자 친화적인 메시지로 변환
      let errorMessage = 'access_denied';
      
      if (error === 'access_denied') {
        errorMessage = 'access_denied';
      } else if (error === 'invalid_request') {
        errorMessage = 'unauthorized';
      } else if (error === 'invalid_client') {
        errorMessage = 'unauthorized';
      } else {
        errorMessage = 'server_error';
      }
      
      // HashRouter를 사용하므로 쿼리 파라미터는 해시(#) 뒤에 와야 함
      const errorUrl = `${frontendUrl}/#/login?error=${encodeURIComponent(errorMessage)}`;
      console.log('[Kakao Callback] Redirecting to error page:', errorUrl);
      return res.redirect(errorUrl);
    }

    // 인가 코드가 없는 경우
    if (!code) {
      console.error('[Kakao Callback] No authorization code received');
      const errorUrl = `${frontendUrl}/#/login?error=${encodeURIComponent('no_code')}`;
      console.log('[Kakao Callback] Redirecting to error page:', errorUrl);
      return res.redirect(errorUrl);
    }

    try {
      console.log('[Kakao Callback] Processing authorization code...');
      
      // 1. 인가 코드로 액세스 토큰 발급
      const tokenResponse = await this.authService.getKakaoAccessToken(code);
      console.log('[Kakao Callback] Access token received');

      // 2. 액세스 토큰으로 사용자 정보 조회
      const kakaoUserInfo = await this.authService.getKakaoUserInfo(tokenResponse.access_token);
      console.log('[Kakao Callback] User info retrieved:', { 
        id: kakaoUserInfo.id,
        hasEmail: !!kakaoUserInfo.kakao_account?.email 
      });

      // 3. 우리 DB에 사용자 저장 또는 업데이트
      const user = await this.authService.findOrCreateKakaoUser(kakaoUserInfo);
      console.log('[Kakao Callback] User saved/updated:', { userId: user.id });

      // 4. JWT 토큰 발급
      const jwt = await this.authService.generateJWT(user);
      console.log('[Kakao Callback] JWT token generated');

      // 5. 프론트엔드로 리다이렉트 (HashRouter 사용)
      // HashRouter를 사용하므로 쿼리 파라미터는 해시(#) 뒤에 와야 함
      // 형식: http://localhost:3000/#/auth/callback?token=...&state=...
      let redirectUrl = `${frontendUrl}/#/auth/callback?token=${encodeURIComponent(jwt.access_token)}`;
      if (state) {
        redirectUrl += `&state=${encodeURIComponent(state)}`;
      }
      
      console.log('[Kakao Callback] Redirecting to frontend:', redirectUrl);
      return res.redirect(redirectUrl);
      
    } catch (error) {
      console.error('[Kakao Callback] Error processing callback:', error);
      
      // 에러 타입에 따라 적절한 리다이렉트
      let errorMessage = 'server_error';
      if (error instanceof UnauthorizedException) {
        errorMessage = 'unauthorized';
        console.error('[Kakao Callback] Unauthorized error:', error.message);
      } else {
        console.error('[Kakao Callback] Unexpected error:', error);
      }
      
      const errorUrl = `${frontendUrl}/#/login?error=${encodeURIComponent(errorMessage)}`;
      console.log('[Kakao Callback] Redirecting to error page:', errorUrl);
      return res.redirect(errorUrl);
    }
  }

  /**
   * 현재 로그인한 사용자 정보 조회
   * 
   * @param user JWT 인증된 사용자 정보
   * @returns 사용자 정보
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string; email: string; nickname: string; avatarUrl: string | null; provider: string }) {
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    };
  }
}
