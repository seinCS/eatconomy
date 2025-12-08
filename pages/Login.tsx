import React, { useState } from 'react';
import { useApp } from '../App';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, Sparkles } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (provider: 'kakao' | 'google') => {
    setIsLoading(true);
    try {
      await login(provider);
      navigate('/');
    } catch (error) {
      alert("로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
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

        <div className="space-y-3">
          <button 
            onClick={() => handleLogin('kakao')}
            disabled={isLoading}
            className="w-full bg-[#FEE500] text-[#000000] py-4 rounded-xl font-bold text-sm shadow-sm hover:bg-[#FDD835] transition flex items-center justify-center gap-2"
          >
            {isLoading ? '연결 중...' : '카카오로 3초 만에 시작하기'}
          </button>
          
          <button 
             onClick={() => handleLogin('google')}
             disabled={isLoading}
             className="w-full bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-50 transition flex items-center justify-center gap-2"
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