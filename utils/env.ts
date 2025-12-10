/// <reference types="vite/client" />

/**
 * 환경 변수 검증 및 관리
 */

interface EnvConfig {
  apiBaseUrl: string;
  kakaoClientId: string;
  kakaoRedirectUri: string;
}

/**
 * 환경 변수 검증
 */
const validateEnv = (): EnvConfig => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const kakaoClientId = import.meta.env.VITE_KAKAO_CLIENT_ID;
  const kakaoRedirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI;

  // 개발 환경에서 경고
  if (import.meta.env.DEV) {
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn('⚠️ VITE_API_BASE_URL is not set. Using default: http://localhost:3001/api');
    }
    if (!kakaoClientId || !kakaoRedirectUri) {
      console.warn('⚠️ Kakao OAuth environment variables are missing!');
      console.warn('   Please check your .env file for VITE_KAKAO_CLIENT_ID and VITE_KAKAO_REDIRECT_URI');
    }
  }

  // 프로덕션 환경에서 필수 변수 검증
  if (import.meta.env.PROD) {
    if (!kakaoClientId || !kakaoRedirectUri) {
      throw new Error('Kakao OAuth environment variables are required in production!');
    }
  }

  return {
    apiBaseUrl,
    kakaoClientId: kakaoClientId || '',
    kakaoRedirectUri: kakaoRedirectUri || '',
  };
};

export const env = validateEnv();

