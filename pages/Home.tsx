import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../App';
import { Sparkles, TrendingUp, Check, Utensils, ChevronRight, User as UserIcon, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import { Recipe } from '../types';
import { getTodayDateKey, getTodayMealIndices } from '../utils/date';

const data = [
  { name: '1주', saved: 25000 },
  { name: '2주', saved: 32000 },
  { name: '3주', saved: 18000 },
  { name: '4주', saved: 45000 },
];

const HomePage: React.FC = () => {
  const { plannedRecipes, resetSession, toggleMealFinished, getMealFinished, user, fridge } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [todaysMeals, setTodaysMeals] = useState<{lunch: Recipe | null, dinner: Recipe | null} | null>(null);
  const [mealsFinished, setMealsFinished] = useState<{lunch: boolean, dinner: boolean}>({ lunch: false, dinner: false });

  // Check if a plan exists
  const hasPlan = plannedRecipes.some(ms => ms.main !== null || ms.side !== null);

  // Determine Today's Meals
  useEffect(() => {
    if (hasPlan) {
      const { lunchIndex, dinnerIndex } = getTodayMealIndices();
      
      const lunchSet = plannedRecipes[lunchIndex];
      const dinnerSet = plannedRecipes[dinnerIndex];

      // 메인만 표시 (기존 호환성 유지)
      const lunch = lunchSet?.main || null;
      const dinner = dinnerSet?.main || null;

      if (lunch || dinner) {
        setTodaysMeals({ lunch, dinner });
      } else {
        setTodaysMeals(null);
      }
    } else {
      setTodaysMeals(null);
    }
  }, [plannedRecipes, hasPlan]);

  // Load meal completion status - 페이지 방문 시마다 실행
  useEffect(() => {
    // hasPlan과 user가 있고, todaysMeals가 설정되었을 때만 실행
    if (hasPlan && user && getMealFinished) {
      // todaysMeals가 null이어도 오늘 날짜의 상태는 로드 가능
      const loadMealStatus = async () => {
        const dateKey = getTodayDateKey();
        try {
          console.log('식사 완료 상태 로드 시작:', { dateKey, userId: user.id });
          const lunchFinished = await getMealFinished(dateKey, 'lunch');
          const dinnerFinished = await getMealFinished(dateKey, 'dinner');
          console.log('로드된 상태:', { lunchFinished, dinnerFinished });
          setMealsFinished({ lunch: lunchFinished, dinner: dinnerFinished });
        } catch (error) {
          console.error('식사 완료 상태 로드 실패:', error);
        }
      };
      loadMealStatus();
    }
  }, [hasPlan, getMealFinished, getTodayDateKey, user, location.pathname]); // todaysMeals 제거 - 항상 로드

  const handleMealComplete = async (mealType: 'lunch' | 'dinner') => {
    try {
      const dateKey = getTodayDateKey();
      // DB 업데이트
      await toggleMealFinished(dateKey, mealType);
      // 업데이트 후 실제 DB에서 다시 가져와서 상태 업데이트
      const updatedStatus = await getMealFinished(dateKey, mealType);
      setMealsFinished(prev => ({
        ...prev,
        [mealType]: updatedStatus
      }));
    } catch (error) {
      console.error('식사 완료 상태 업데이트 실패:', error);
      // 에러 발생 시에도 UI 피드백을 위해 로컬 상태 업데이트
      setMealsFinished(prev => ({
        ...prev,
        [mealType]: !prev[mealType]
      }));
    }
  };

  const handleStartPlanning = () => {
    resetSession();
    navigate('/swipe');
  };

  // Helper: Check if recipe ingredients are mostly in fridge
  const getRecipeReadiness = (recipe: Recipe | null): { ready: boolean; missingCount: number } => {
    if (!recipe) return { ready: false, missingCount: 0 };
    const missing = recipe.ingredients.filter(ing => !fridge.includes(ing));
    return { ready: missing.length <= 1, missingCount: missing.length };
  };

  return (
    <div className="p-6 pt-10 pb-24">
      <header className="mb-8 flex justify-between items-start">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">
              안녕하세요, <br/>
              <span className="text-orange-500">{user?.nickname || '자취생'}</span>님!
            </h1>
            <p className="text-gray-500 mt-2 text-sm">오늘도 낭비 없는 하루 보내세요.</p>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UserIcon size={20} className="text-gray-400" />
            </div>
          )}
        </button>
      </header>

      {/* Dynamic Content: Today's Meals vs Stats */}
      {hasPlan && todaysMeals && (todaysMeals.lunch || todaysMeals.dinner) ? (
        <section className="bg-white rounded-2xl p-6 shadow-xl border border-orange-100 mb-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
             <div className="mb-4">
                <h2 className="text-sm font-bold text-orange-600 flex items-center mb-3">
                    <Utensils size={14} className="mr-1"/> 오늘의 식단
                </h2>
                
                {/* Lunch */}
                {todaysMeals.lunch && (
                  <div className={`mb-3 p-3 rounded-xl border-2 transition-all ${
                    mealsFinished.lunch 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">점심</span>
                          {mealsFinished.lunch && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              완료
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-900">{todaysMeals.lunch.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{todaysMeals.lunch.time}</span>
                          {(() => {
                            const readiness = getRecipeReadiness(todaysMeals.lunch);
                            if (readiness.ready) {
                              return <span className="text-xs text-green-600 font-medium">✓ 재료 준비됨</span>;
                            } else {
                              return <span className="text-xs text-orange-600 font-medium">⚠ 재료 {readiness.missingCount}개 부족</span>;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden ml-2 flex-shrink-0">
                        <img 
                          src={`/images/recipes/${todaysMeals.lunch.id}.jpg`} 
                          alt={todaysMeals.lunch.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 이미지 로드 실패 시 플레이스홀더로 대체
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${todaysMeals.lunch.id}/100/100`;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('/plan')}
                        className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-transform"
                      >
                        레시피 보기
                      </button>
                      <button 
                        onClick={() => handleMealComplete('lunch')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs border active:scale-95 transition-all flex items-center justify-center gap-1 ${
                          mealsFinished.lunch 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {mealsFinished.lunch ? <><Check size={14}/> 완료</> : '완료 체크'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Dinner */}
                {todaysMeals.dinner && (
                  <div className={`p-3 rounded-xl border-2 transition-all ${
                    mealsFinished.dinner 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">저녁</span>
                          {mealsFinished.dinner && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              완료
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-gray-900">{todaysMeals.dinner.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock size={12} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{todaysMeals.dinner.time}</span>
                          {(() => {
                            const readiness = getRecipeReadiness(todaysMeals.dinner);
                            if (readiness.ready) {
                              return <span className="text-xs text-green-600 font-medium">✓ 재료 준비됨</span>;
                            } else {
                              return <span className="text-xs text-orange-600 font-medium">⚠ 재료 {readiness.missingCount}개 부족</span>;
                            }
                          })()}
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden ml-2 flex-shrink-0">
                        <img 
                          src={`/images/recipes/${todaysMeals.dinner.id}.jpg`} 
                          alt={todaysMeals.dinner.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // 이미지 로드 실패 시 플레이스홀더로 대체
                            (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${todaysMeals.dinner.id}/100/100`;
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => navigate('/plan')}
                        className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-bold text-xs shadow-sm active:scale-95 transition-transform"
                      >
                        레시피 보기
                      </button>
                      <button 
                        onClick={() => handleMealComplete('dinner')}
                        className={`flex-1 py-2 rounded-lg font-bold text-xs border active:scale-95 transition-all flex items-center justify-center gap-1 ${
                          mealsFinished.dinner 
                          ? 'bg-green-100 text-green-700 border-green-200' 
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {mealsFinished.dinner ? <><Check size={14}/> 완료</> : '완료 체크'}
                      </button>
                    </div>
                  </div>
                )}
             </div>
        </section>
      ) : (
        // Fallback or Stats when no plan
        <section className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-800 flex items-center">
                <TrendingUp size={18} className="mr-2 text-orange-500"/> 
                이번 달 절약액
            </h2>
            <span className="text-2xl font-bold text-orange-600">120,000원</span>
            </div>
            
            <div className="h-32 w-full mb-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="saved" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-gray-400 text-right">* 가상 시뮬레이션 데이터입니다.</p>
        </section>
      )}

      {/* Main CTA */}
      {!hasPlan ? (
        <button 
            onClick={handleStartPlanning}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center relative overflow-hidden group active:scale-98 transition-transform"
        >
            <span className="relative z-10 flex items-center">
            <Sparkles className="mr-2 text-yellow-400" />
            식단 추천 시작하기
            </span>
            <div className="absolute inset-0 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
            <div 
                onClick={() => navigate('/fridge')}
                className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between cursor-pointer active:bg-gray-50"
            >
                <div>
                    <h3 className="font-bold text-gray-900 text-sm">내 냉장고 관리</h3>
                    <p className="text-xs text-gray-500">재료를 추가하거나 수정하세요</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
            </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
