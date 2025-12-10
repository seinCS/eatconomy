/**
 * 프론트엔드 에러 추적 유틸리티
 * 향후 Sentry 등 에러 추적 서비스 연동을 위한 인터페이스
 */

interface ErrorContext {
  userId?: string;
  path?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

/**
 * 에러 추적 서비스 인터페이스
 */
class ErrorTrackingService {
  private initialized = false;

  /**
   * 에러 추적 서비스 초기화
   */
  init(): void {
    if (import.meta.env.PROD && !this.initialized) {
      // TODO: Sentry 등 에러 추적 서비스 초기화
      // 예: Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
      this.initialized = true;
    }
  }

  /**
   * 에러 캡처 및 전송
   */
  captureException(error: Error, context?: ErrorContext): void {
    if (!this.initialized) {
      // 개발 환경에서는 콘솔에만 출력
      console.error('Error captured:', error, context);
      return;
    }

    // TODO: Sentry 등으로 에러 전송
    // 예: Sentry.captureException(error, { extra: context });
  }

  /**
   * 메시지 캡처 및 전송
   */
  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): void {
    if (!this.initialized) {
      console.log(`[${level.toUpperCase()}]`, message, context);
      return;
    }

    // TODO: Sentry 등으로 메시지 전송
    // 예: Sentry.captureMessage(message, { level, extra: context });
  }

  /**
   * 사용자 컨텍스트 설정
   */
  setUser(userId: string, email?: string): void {
    if (!this.initialized) return;

    // TODO: Sentry 등에 사용자 정보 설정
    // 예: Sentry.setUser({ id: userId, email });
  }

  /**
   * 사용자 컨텍스트 제거
   */
  clearUser(): void {
    if (!this.initialized) return;

    // TODO: Sentry 등에서 사용자 정보 제거
    // 예: Sentry.setUser(null);
  }
}

export const errorTracking = new ErrorTrackingService();

// 앱 시작 시 초기화
if (typeof window !== 'undefined') {
  errorTracking.init();
  
  // 전역 에러 핸들러
  window.addEventListener('error', (event) => {
    errorTracking.captureException(event.error, {
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    });
  });

  // Promise rejection 핸들러
  window.addEventListener('unhandledrejection', (event) => {
    errorTracking.captureException(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        type: 'unhandledrejection',
      }
    );
  });
}

