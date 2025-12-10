import React, { Component, ErrorInfo, ReactNode } from 'react';
import { XCircle, RefreshCw } from 'lucide-react';
import { getErrorMessage, logError } from '../utils/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * 하위 컴포넌트에서 발생한 에러를 캐치하여 사용자에게 표시
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError(error, 'ErrorBoundary');
    
    // 에러 추적 서비스로 전송
    import('../utils/errorTracking').then(({ errorTracking }) => {
      errorTracking.captureException(error, {
        componentStack: errorInfo.componentStack,
        path: window.location.pathname,
        timestamp: new Date().toISOString(),
      });
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMessage = this.state.error
        ? getErrorMessage(this.state.error)
        : '알 수 없는 오류가 발생했습니다.';

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </button>
              <button
                onClick={() => (window.location.href = '/#/')}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
              >
                홈으로
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer">에러 상세 정보</summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

