/// <reference types="vite/client" />

import { env } from '../utils/env';
import { getErrorMessage, getErrorInfo, logError, ErrorType } from '../utils/errors';

/**
 * JWT 토큰 관리
 */
const TOKEN_KEY = 'eat_jwt_token';

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * API 요청 옵션
 */
interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  data?: unknown;
}

/**
 * 공통 API 요청 처리 함수
 */
const request = async <T>({ method, endpoint, data }: RequestOptions): Promise<T> => {
  const token = getToken();
  const url = `${env.apiBaseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`[API Client] ${method} ${endpoint}`, data ? { hasData: true } : {});

    const response = await fetch(url, config);

    if (!response.ok) {
      // 401 인증 오류 처리
      if (response.status === 401) {
        console.error(`[API Client] Unauthorized: ${method} ${endpoint}`);
        removeToken();
        // localStorage에서 사용자 정보도 제거
        if (typeof window !== 'undefined') {
          localStorage.removeItem('eat_user');
        }
        throw new Error('Unauthorized');
      }

      // 에러 응답 파싱
      let errorMessage = 'Request failed';
      let errorDetails: Record<string, unknown> = {};
      
      try {
        errorDetails = await response.json();
        errorMessage = 
          (errorDetails.message as string) || 
          (errorDetails.error as string) || 
          errorMessage;
      } catch {
        // JSON 파싱 실패 시 상태 코드 기반 메시지 사용
        errorMessage = `Request failed with status ${response.status}`;
      }

      console.error(`[API Client] Request failed: ${method} ${endpoint}`, {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        errorDetails,
      });

      // HTTP 상태 코드에 따른 사용자 친화적 메시지
      if (response.status === 400) {
        errorMessage = errorMessage || '잘못된 요청입니다.';
      } else if (response.status === 403) {
        errorMessage = '접근 권한이 없습니다.';
      } else if (response.status === 404) {
        errorMessage = '요청한 리소스를 찾을 수 없습니다.';
      } else if (response.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }

      // 네트워크 오류가 아닌 경우 상세 정보 포함
      const apiError = new Error(errorMessage);
      (apiError as Error & { statusCode?: number; response?: unknown }).statusCode = response.status;
      (apiError as Error & { statusCode?: number; response?: unknown }).response = errorDetails;
      throw apiError;
    }

    const responseData = await response.json();
    console.log(`[API Client] Success: ${method} ${endpoint}`);
    return responseData;
  } catch (error) {
    const errorInfo = getErrorInfo(error);
    console.error(`[API Client] Error: ${method} ${endpoint}`, {
      error: error instanceof Error ? error.message : String(error),
      errorInfo,
    });
    logError(error, `API ${method} ${endpoint}`);
    
    // 네트워크 오류인 경우 재시도 로직 고려 (향후 구현)
    if (errorInfo.type === ErrorType.NETWORK) {
      // TODO: 재시도 로직 구현
    }
    
    throw error;
  }
};

/**
 * API 클라이언트
 */
export const apiClient = {
  /**
   * GET 요청
   */
  get: <T>(endpoint: string): Promise<T> => {
    return request<T>({ method: 'GET', endpoint });
  },

  /**
   * POST 요청
   */
  post: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return request<T>({ method: 'POST', endpoint, data });
  },

  /**
   * PUT 요청
   */
  put: <T>(endpoint: string, data?: unknown): Promise<T> => {
    return request<T>({ method: 'PUT', endpoint, data });
  },

  /**
   * DELETE 요청
   */
  delete: <T>(endpoint: string): Promise<T> => {
    return request<T>({ method: 'DELETE', endpoint });
  },
};
