import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UtensilsCrossed, Sparkles, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';

const LoginPage: React.FC = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 이미 로그인되어 있으면 홈으로 리다이렉트
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // URL 파라미터에서 에러 메시지 확인
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        unauthorized: '인증에 실패했습니다. 카카오 개발자 콘솔의 Redirect URI 설정을 확인해주세요.',
        no_code: '인가 코드를 받지 못했습니다. 다시 시도해주세요.',
        server_error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        access_denied: '로그인이 취소되었습니다.',
      };
      setErrorMessage(errorMessages[error] || '로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }, [searchParams]);

  const handleLogin = (provider: 'kakao' | 'google') => {
    if (provider === 'kakao') {
      setIsLoading(true);
      setErrorMessage('');
      // 카카오 로그인: 카카오 인가 서버로 리다이렉트
      authService.loginWithKakao();
      // 리다이렉트되므로 setIsLoading은 실제로는 필요 없지만 UX를 위해 유지
    } else {
      // Google 로그인은 아직 구현 안 됨
      alert('Google 로그인은 준비 중입니다.');
    }
  };

  return (
    <div className="min-h-screen bg-orange-500 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute -top-20 -left-20 w-64 h-64 bg-white rounded-full mix-blend-overlay filter blur-3xl"></div>
         <div className="absolute bottom-10 right-10 w-80 h-80 bg-yellow-300 rounded-full mix-blend-overlay filter blur-3xl"></div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <UtensilsCrossed size={40} className="text-orange-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 font-mono tracking-tight">
          Eat-conomy
        </h1>
        <p className="text-gray-500 mb-8 font-medium">
          자취생을 위한<br/>식비 방어 솔루션
        </p>

        {/* 에러 메시지 표시 */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 text-left">{errorMessage}</p>
          </div>
        )}

        <div className="space-y-3">
          <button 
            onClick={() => handleLogin('kakao')}
            disabled={isLoading}
            className="w-full bg-[#FEE500] text-[#000000] py-4 rounded-xl font-bold text-sm shadow-sm hover:bg-[#FDD835] transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '연결 중...' : '카카오로 3초 만에 시작하기'}
          </button>
          
          <button 
             onClick={() => handleLogin('google')}
             disabled={isLoading}
             className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Google로 계속하기
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
      
      <div className="mt-8 flex items-center gap-2 text-white/80 text-sm font-medium animate-pulse">
        <Sparkles size={16} />
        <span>지금 시작하면 첫 달 예상 절약액 확인 가능!</span>
      </div>
    </div>
  );
};

export default LoginPage;
