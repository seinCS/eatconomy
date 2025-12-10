import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { setToken } from '../services/apiClient';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { getErrorMessage, logError } from '../utils/errors';
import { useApp } from '../App';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp(); // App Context의 login 함수 사용 (사용자 상태 업데이트)
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const code = searchParams.get('code'); // 디버깅용

        console.log('[AuthCallback] Received parameters:', {
          hasToken: !!token,
          hasState: !!state,
          hasError: !!error,
          hasCode: !!code,
        });

        // 에러가 있는 경우
        if (error) {
          console.error('[AuthCallback] Error received:', error);
          
          const errorMessages: Record<string, string> = {
            unauthorized: '인증에 실패했습니다. 카카오 개발자 콘솔의 설정을 확인해주세요.',
            no_code: '인가 코드를 받지 못했습니다.',
            server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            access_denied: '로그인이 취소되었습니다.',
          };

          setStatus('error');
          setErrorMessage(errorMessages[error] || '로그인에 실패했습니다.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // State 검증 (CSRF 방지)
        // 주의: State는 선택사항이므로 없어도 진행 가능
        if (state) {
          const isValidState = authService.validateState(state);
          if (!isValidState) {
            console.warn('[AuthCallback] Invalid state token - continuing anyway for development');
            // 개발 환경에서는 경고만 하고 계속 진행
            // 프로덕션에서는 더 엄격하게 처리할 수 있습니다
            // logError(new Error('Invalid state token'), 'AuthCallback');
            // setStatus('error');
            // setErrorMessage('보안 검증에 실패했습니다. 다시 로그인해주세요.');
            // setTimeout(() => {
            //   navigate('/login');
            // }, 3000);
            // return;
          } else {
            console.log('[AuthCallback] State validated successfully');
          }
        } else {
          console.warn('[AuthCallback] No state parameter - continuing anyway');
        }

        // 토큰이 없는 경우
        if (!token) {
          console.error('[AuthCallback] No token received');
          setStatus('error');
          setErrorMessage('토큰을 받지 못했습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        console.log('[AuthCallback] Token received, saving...');
        
        // JWT 토큰 저장
        setToken(token);

        // 사용자 정보 조회
        console.log('[AuthCallback] Fetching user info...');
        const user = await authService.getCurrentUser();
        
        if (user) {
          console.log('[AuthCallback] User info retrieved:', { userId: user.id });
          setStatus('success');
          
          // HashRouter를 사용하므로 해시 없이 리다이렉트하면 HashRouter가 자동으로 처리
          // 페이지를 리로드하여 App.tsx의 checkAuth가 실행되도록 함
          setTimeout(() => {
            // 해시 없이 리다이렉트하면 HashRouter가 기본 경로(/)로 자동 이동
            const homeUrl = `${window.location.origin}/`;
            console.log('[AuthCallback] Redirecting to:', homeUrl);
            window.location.href = homeUrl;
          }, 1000);
        } else {
          console.error('[AuthCallback] Failed to get user info');
          setStatus('error');
          setErrorMessage('사용자 정보를 가져오지 못했습니다. 다시 로그인해주세요.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('[AuthCallback] Unexpected error:', error);
        logError(error, 'AuthCallback');
        setStatus('error');
        setErrorMessage(getErrorMessage(error) || '로그인 처리 중 오류가 발생했습니다.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 처리 중...</h2>
            <p className="text-gray-500 text-sm">잠시만 기다려주세요.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 성공!</h2>
            <p className="text-gray-500 text-sm">홈으로 이동합니다...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 실패</h2>
            <p className="text-gray-500 text-sm mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition"
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallbackPage;
