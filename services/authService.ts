import { User } from '../types';
import { apiClient, getToken, removeToken } from './apiClient';
import { env } from '../utils/env';
import { getErrorMessage, logError } from '../utils/errors';

/**
 * CSRF 공격 방지를 위한 state 토큰 생성 및 검증
 */
const STATE_KEY = 'kakao_oauth_state';

/**
 * 랜덤 state 토큰 생성
 */
const generateState = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * State 토큰 저장
 */
const saveState = (state: string): void => {
  sessionStorage.setItem(STATE_KEY, state);
};

/**
 * State 토큰 검증 및 제거
 */
const validateAndRemoveState = (state: string): boolean => {
  const savedState = sessionStorage.getItem(STATE_KEY);
  if (savedState && savedState === state) {
    sessionStorage.removeItem(STATE_KEY);
    return true;
  }
  return false;
};

export const authService = {
  /**
   * 카카오 로그인 시작
   * 카카오 인가 서버로 리다이렉트하여 인가 코드를 받습니다.
   * 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api
   * 
   * 보안: CSRF 공격 방지를 위해 state 파라미터를 사용합니다.
   */
  loginWithKakao: (): void => {
    if (!env.kakaoClientId || !env.kakaoRedirectUri) {
      const errorMsg = '카카오 로그인 설정이 올바르지 않습니다. 환경 변수를 확인해주세요.';
      console.error('[AuthService] Missing Kakao OAuth configuration:', {
        hasClientId: !!env.kakaoClientId,
        hasRedirectUri: !!env.kakaoRedirectUri,
      });
      if (typeof window !== 'undefined') {
        alert(errorMsg);
      }
      logError(new Error(errorMsg), 'loginWithKakao');
      return;
    }

    // CSRF 방지를 위한 state 토큰 생성
    const state = generateState();
    saveState(state);

    // 카카오 인가 코드 요청 URL 생성
    // 참고: https://developers.kakao.com/docs/latest/ko/kakaologin/rest-api#인가-코드-요청
    const authUrl = new URL('https://kauth.kakao.com/oauth/authorize');
    authUrl.searchParams.set('client_id', env.kakaoClientId);
    authUrl.searchParams.set('redirect_uri', env.kakaoRedirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state); // CSRF 방지

    console.log('[AuthService] Redirecting to Kakao OAuth:', {
      clientId: env.kakaoClientId.substring(0, 10) + '...',
      redirectUri: env.kakaoRedirectUri,
      hasState: !!state,
    });

    window.location.href = authUrl.toString();
  },

  /**
   * Google 로그인 (미구현)
   */
  loginWithGoogle: async (): Promise<User> => {
    throw new Error('Google login not implemented yet');
  },

  /**
   * 현재 로그인한 사용자 정보 조회
   * 
   * @returns 사용자 정보 또는 null (인증되지 않은 경우)
   */
  getCurrentUser: async (): Promise<User | null> => {
    const token = getToken();
    if (!token) {
      console.log('[AuthService] No token found');
      return null;
    }

    console.log('[AuthService] Fetching user info...');

    try {
      const userData = await apiClient.get<{
        id: string;
        email: string;
        nickname: string;
        avatarUrl: string | null;
        provider: string;
      }>('/auth/me');

      const user: User = {
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
        avatarUrl: userData.avatarUrl || '',
      };

      console.log('[AuthService] User info retrieved:', { userId: user.id });

      // 사용자 정보를 localStorage에 저장 (선택적, 성능 최적화용)
      if (typeof window !== 'undefined') {
        localStorage.setItem('eat_user', JSON.stringify(user));
      }
      return user;
    } catch (error) {
      console.error('[AuthService] Failed to get user info:', error);
      logError(error, 'getCurrentUser');
      removeToken();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('eat_user');
      }
      return null;
    }
  },

  /**
   * 로그아웃
   * 
   * 토큰과 사용자 정보를 제거합니다.
   */
  logout: async (): Promise<void> => {
    removeToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('eat_user');
      sessionStorage.removeItem(STATE_KEY);
    }
  },

  /**
   * State 토큰 검증 (내부 사용)
   * 
   * @param state 검증할 state 토큰
   * @returns 검증 성공 여부
   */
  validateState: (state: string): boolean => {
    return validateAndRemoveState(state);
  },
};
