/**
 * 에러 처리 유틸리티
 */

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
}

/**
 * 에러 타입 정의
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 에러 정보 추출
 */
export const getErrorInfo = (error: unknown): { type: ErrorType; message: string; statusCode?: number } => {
  if (error instanceof Error) {
    // 네트워크 에러
    if (
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError') ||
      error.message.includes('Network request failed')
    ) {
      return {
        type: ErrorType.NETWORK,
        message: '네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.',
      };
    }

    // 인증 에러
    if (
      error.message.includes('Unauthorized') ||
      error.message === 'Unauthorized' ||
      error.message.includes('Invalid token') ||
      error.message.includes('Token expired')
    ) {
      return {
        type: ErrorType.AUTH,
        message: '로그인이 필요합니다. 다시 로그인해주세요.',
        statusCode: 401,
      };
    }

    // Validation 에러
    if (error.message.includes('validation') || error.message.includes('Validation')) {
      return {
        type: ErrorType.VALIDATION,
        message: error.message || '입력값을 확인해주세요.',
        statusCode: 400,
      };
    }

    // 서버 에러
    if (error.message.includes('Internal Server Error') || error.message.includes('500')) {
      return {
        type: ErrorType.SERVER,
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        statusCode: 500,
      };
    }

    // 기타 에러
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || '오류가 발생했습니다.',
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: '알 수 없는 오류가 발생했습니다.',
  };
};

/**
 * API 에러를 사용자 친화적 메시지로 변환
 */
export const getErrorMessage = (error: unknown): string => {
  return getErrorInfo(error).message;
};

/**
 * 에러 로깅 (개발 환경에서만)
 */
export const logError = (error: unknown, context?: string): void => {
  const errorInfo = getErrorInfo(error);
  
  if (import.meta.env.DEV) {
    console.error(
      `[Error${context ? ` in ${context}` : ''}]`,
      {
        type: errorInfo.type,
        message: errorInfo.message,
        statusCode: errorInfo.statusCode,
        originalError: error,
      }
    );
  }
  
  // 프로덕션 환경에서는 에러 추적 서비스로 전송 (비동기로 처리)
  if (import.meta.env.PROD && errorInfo.type === ErrorType.SERVER) {
    import('./errorTracking').then(({ errorTracking }) => {
      errorTracking.captureException(
        error instanceof Error ? error : new Error(String(error)),
        {
          context,
          type: errorInfo.type,
          statusCode: errorInfo.statusCode,
        }
      );
    }).catch(() => {
      // 에러 추적 서비스 로드 실패 시 무시 (에러 로깅 자체가 실패하면 안 됨)
    });
  }
};

