import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { DAYS } from '../constants';
import { getSharedIngredients, getAlternativeRecipes, getAllRecipes } from '../services/recipeService';
import { Clock, Link as LinkIcon, Info, Repeat, CheckCircle, TrendingUp, Flame, Leaf, Check, X, ShoppingCart } from 'lucide-react';
import { Recipe, MealSet } from '../types';
import { useNavigate } from 'react-router-dom';

interface SlotData {
    mealSet: MealSet;
    index: number;
    isMain: boolean; // 메인인지 반찬인지
}

const PlanPage: React.FC = () => {
  const { plannedRecipes, updatePlan, dislikedRecipes, fridge } = useApp();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  
  // Re-roll state
  const [isReplacing, setIsReplacing] = useState(false);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);

  // --- Real-time Dashboard Logic ---
  const dashboardStats = useMemo(() => {
    // 모든 메인과 반찬을 합쳐서 계산
    const allRecipes: Recipe[] = [];
    plannedRecipes.forEach(ms => {
      if (ms.main) allRecipes.push(ms.main);
      if (ms.side) allRecipes.push(ms.side);
    });
    
    // 1. Estimated Savings: (Meal Count * 15,000) - (Meal Count * 5,000) = Count * 10,000
    const savings = allRecipes.length * 10000;

    // 2. Daily Avg Calories: Total Calories / 7
    const totalCalories = allRecipes.reduce((sum, r) => sum + r.calories, 0);
    const avgCalories = Math.round(totalCalories / 7);

    // 3. Chain Count (Zero Waste Success) - 다른 날 재료 연결성 확인
    let chainCount = 0;
    for (let i = 0; i < 7; i++) {
        const lunchSet = plannedRecipes[i * 2];
        const dinnerSet = plannedRecipes[i * 2 + 1];
        const prevDinnerSet = i > 0 ? plannedRecipes[(i - 1) * 2 + 1] : null;

        // Lunch <- Prev Dinner (다른 날 연결 보너스)
        if (prevDinnerSet?.main && lunchSet?.main && getSharedIngredients(prevDinnerSet.main, lunchSet.main).length > 0) {
            chainCount++;
        }
        // Dinner <- Lunch (같은 날 내 연결은 카운트하지 않음 - 요구사항 반영)
    }

    return { savings, avgCalories, chainCount };
  }, [plannedRecipes]);

  const handleRecipeClick = (mealSet: MealSet, index: number, isMain: boolean) => {
    setSelectedSlot({ mealSet, index, isMain });
    setIsReplacing(false); // Reset replace view
  };

  // Helper: Check recipe ingredient readiness
  const getRecipeReadiness = (recipe: Recipe) => {
    const available = recipe.ingredients.filter(ing => fridge.includes(ing));
    const missing = recipe.ingredients.filter(ing => !fridge.includes(ing));
    const readiness = Math.round((available.length / recipe.ingredients.length) * 100);
    return { available, missing, readiness, ready: missing.length <= 1 };
  };

  // Helper: Get chain cooking info
  const getChainInfo = (index: number) => {
    const currentRecipe = selectedSlot!.isMain ? selectedSlot!.mealSet.main : selectedSlot!.mealSet.side;
    if (!currentRecipe) return { prevChain: [], nextChain: [] };
    
    const prevSet = index > 0 ? plannedRecipes[index - 1] : null;
    const nextSet = index < plannedRecipes.length - 1 ? plannedRecipes[index + 1] : null;
    
    // 다른 날과의 연결만 확인 (하루 내 연결은 제외)
    const prevRecipe = prevSet?.main || null;
    const nextRecipe = nextSet?.main || null;
    
    const prevChain = prevRecipe ? getSharedIngredients(prevRecipe, currentRecipe) : [];
    const nextChain = nextRecipe ? getSharedIngredients(currentRecipe, nextRecipe) : [];
    
    return { prevChain, nextChain };
  };

  const handleStartReplace = () => {
      if (!selectedSlot) return;
      
      const index = selectedSlot.index;
      const currentRecipe = selectedSlot.isMain ? selectedSlot.mealSet.main : selectedSlot.mealSet.side;
      if (!currentRecipe) return;
      
      const prevSet = index > 0 ? plannedRecipes[index - 1] : null;
      const prevRecipe = prevSet?.main || null;
      
      const isLunch = index % 2 === 0;
      const otherSlotSet = isLunch ? plannedRecipes[index + 1] : plannedRecipes[index - 1];
      const otherSlotRecipe = otherSlotSet?.main || null;

      const all = getAllRecipes();
      const candidates = getAlternativeRecipes(
          currentRecipe.id, 
          prevRecipe, 
          otherSlotRecipe, 
          all, 
          dislikedRecipes
      );
      
      setAlternatives(candidates);
      setIsReplacing(true);
  };

  const confirmReplacement = (newRecipe: Recipe) => {
      if (!selectedSlot) return;
      const mealSet = { ...selectedSlot.mealSet };
      if (selectedSlot.isMain) {
        mealSet.main = newRecipe;
      } else {
        mealSet.side = newRecipe;
      }
      updatePlan(selectedSlot.index, mealSet);
      setSelectedSlot(null);
      setIsReplacing(false);
  };

  return (
    <div className="p-6 pb-24 min-h-screen bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">이번 주 식단표</h1>
      </div>

      {/* Real Data Dashboard (3 Cards) */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {/* Card 1: Savings */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mb-2">
                <TrendingUp size={16} className="text-orange-600" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">예상 절약</span>
            <span className="text-sm font-bold text-gray-900">
                {dashboardStats.savings.toLocaleString()}원
            </span>
        </div>

        {/* Card 2: Calories */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
             <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <Flame size={16} className="text-red-600" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">일 평균</span>
            <span className="text-sm font-bold text-gray-900">
                {dashboardStats.avgCalories} kcal
            </span>
        </div>

        {/* Card 3: Chain Count */}
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
             <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <Leaf size={16} className="text-green-600" />
            </div>
            <span className="text-[10px] text-gray-400 font-medium">냉장고 파먹기</span>
            <span className="text-sm font-bold text-gray-900">
                {dashboardStats.chainCount}회 성공!
            </span>
        </div>
      </div>

      {/* Timeline View */}
      <div className="space-y-0">
        {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayName = DAYS[dayIndex];
            const lunchIndex = dayIndex * 2;
            const dinnerIndex = dayIndex * 2 + 1;
            const lunchSet = plannedRecipes[lunchIndex];
            const dinnerSet = plannedRecipes[dinnerIndex];

            // Chain Logic Check (다른 날 연결만 확인)
            // 1. Previous Dinner -> Today Lunch
            const prevDinnerSet = dayIndex > 0 ? plannedRecipes[(dayIndex-1)*2 + 1] : null;
            const chainToLunch = prevDinnerSet?.main && lunchSet?.main 
              ? getSharedIngredients(prevDinnerSet.main, lunchSet.main) 
              : [];

            // 2. Today Lunch -> Today Dinner (하루 내 연결은 표시하지 않음 - 요구사항 반영)
            // const chainToDinner = lunchSet?.main && dinnerSet?.main 
            //   ? getSharedIngredients(lunchSet.main, dinnerSet.main) 
            //   : [];

            return (
                <div key={dayName} className="relative pl-8 border-l-2 border-gray-200 last:border-0 pb-8">
                    {/* Day Label */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                    <h3 className="text-sm font-bold text-gray-400 mb-4">{dayName}</h3>

                    {/* Lunch Slot */}
                    <div className="mb-2 relative">
                         {/* Chain Visualizer (from prev dinner) */}
                         {chainToLunch.length > 0 && (
                            <div className="absolute -top-6 left-4 right-0 flex justify-center z-0">
                                <div className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 flex items-center">
                                    <LinkIcon size={10} className="mr-1"/>
                                    {chainToLunch[0]} 연계
                                </div>
                            </div>
                        )}
                        <MealCard 
                            type="점심" 
                            mealSet={lunchSet} 
                            onClickMain={() => lunchSet?.main && handleRecipeClick(lunchSet, lunchIndex, true)}
                            onClickSide={() => lunchSet?.side && handleRecipeClick(lunchSet, lunchIndex, false)}
                        />
                    </div>

                    {/* Dinner Slot */}
                    <div className="mt-2">
                        <MealCard 
                            type="저녁" 
                            mealSet={dinnerSet} 
                            onClickMain={() => dinnerSet?.main && handleRecipeClick(dinnerSet, dinnerIndex, true)}
                            onClickSide={() => dinnerSet?.side && handleRecipeClick(dinnerSet, dinnerIndex, false)}
                        />
                    </div>
                </div>
            );
        })}
      </div>

      {/* Recipe Detail Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
                {!isReplacing ? (
                    // --- View 1: Detail ---
                    <>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                                <h2 className="text-xl font-bold mb-1">
                                    {selectedSlot.isMain 
                                      ? selectedSlot.mealSet.main?.name || '메인 없음'
                                      : selectedSlot.mealSet.side?.name || '반찬 없음'}
                                </h2>
                                {(() => {
                                  const currentRecipe = selectedSlot.isMain ? selectedSlot.mealSet.main : selectedSlot.mealSet.side;
                                  if (!currentRecipe) return null;
                                  return (
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock size={12} />
                                            <span>{currentRecipe.time}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Flame size={12} />
                                            <span>{currentRecipe.calories} kcal</span>
                                        </div>
                                    </div>
                                  );
                                })()}
                            </div>
                            <button onClick={() => setSelectedSlot(null)} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={18} />
                            </button>
                        </div>

                        {/* 재료 준비 상태 */}
                        {(() => {
                            const currentRecipe = selectedSlot.isMain ? selectedSlot.mealSet.main : selectedSlot.mealSet.side;
                            if (!currentRecipe) return null;
                            const readiness = getRecipeReadiness(currentRecipe);
                            return (
                                <div className={`p-4 rounded-xl border mb-4 ${
                                    readiness.ready 
                                        ? 'bg-green-50 border-green-200' 
                                        : readiness.readiness >= 50 
                                        ? 'bg-yellow-50 border-yellow-200' 
                                        : 'bg-red-50 border-red-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-bold text-sm flex items-center">
                                            <ShoppingCart size={14} className="mr-1.5"/>
                                            재료 준비 상태
                                        </h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                            readiness.ready 
                                                ? 'bg-green-200 text-green-700' 
                                                : readiness.readiness >= 50 
                                                ? 'bg-yellow-200 text-yellow-700' 
                                                : 'bg-red-200 text-red-700'
                                        }`}>
                                            {readiness.readiness}%
                                        </span>
                                    </div>
                                    
                                    {readiness.available.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-xs text-gray-600 mb-1.5 font-medium">✓ 보유한 재료 ({readiness.available.length}개)</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {readiness.available.map(ing => (
                                                    <span key={ing} className="text-xs bg-white px-2 py-1 rounded-md text-green-700 font-medium">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {readiness.missing.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1.5 font-medium">✗ 부족한 재료 ({readiness.missing.length}개)</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {readiness.missing.map(ing => (
                                                    <span key={ing} className="text-xs bg-white px-2 py-1 rounded-md text-red-700 font-medium">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* 연계 요리 정보 */}
                        {(() => {
                            const chainInfo = getChainInfo(selectedSlot.index);
                            if (chainInfo.prevChain.length === 0 && chainInfo.nextChain.length === 0) return null;
                            
                            return (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 mb-4">
                                    <h4 className="font-bold text-blue-700 text-sm mb-2 flex items-center">
                                        <LinkIcon size={14} className="mr-1.5"/>
                                        재료 연계 정보
                                    </h4>
                                    {chainInfo.prevChain.length > 0 && (
                                        <div className="mb-2">
                                            <p className="text-xs text-gray-600 mb-1">이전 식사와 공유 재료</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {chainInfo.prevChain.map(ing => (
                                                    <span key={ing} className="text-xs bg-white px-2 py-1 rounded-md text-blue-700 font-medium">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {chainInfo.nextChain.length > 0 && (
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">다음 식사와 공유 재료</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {chainInfo.nextChain.map(ing => (
                                                    <span key={ing} className="text-xs bg-white px-2 py-1 rounded-md text-blue-700 font-medium">
                                                        {ing}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* 태그 */}
                        {(() => {
                          const currentRecipe = selectedSlot.isMain ? selectedSlot.mealSet.main : selectedSlot.mealSet.side;
                          if (!currentRecipe || currentRecipe.tags.length === 0) return null;
                          return (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {currentRecipe.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                          );
                        })()}

                        <div className="flex gap-3">
                            <button 
                                onClick={handleStartReplace}
                                className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold flex items-center justify-center gap-2 active:bg-gray-50"
                            >
                                <Repeat size={16} />
                                메뉴 교체
                            </button>
                            <button 
                                onClick={() => navigate('/list')}
                                className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:bg-orange-600"
                            >
                                <ShoppingCart size={16} />
                                장보기 목록
                            </button>
                        </div>
                    </>
                ) : (
                    // --- View 2: Replace Options ---
                    <>
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <Repeat size={20} className="mr-2 text-orange-500" />
                            다른 메뉴로 교체
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            재료가 효율적으로 연결되는 추천 메뉴입니다.
                        </p>
                        
                        <div className="space-y-3 mb-6">
                            {alternatives.map((alt) => (
                                <div 
                                    key={alt.id}
                                    onClick={() => confirmReplacement(alt)}
                                    className="p-3 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 cursor-pointer flex items-center gap-3 transition"
                                >
                                    <img 
                                      src={`/images/recipes/${alt.id}.jpg`} 
                                      alt={alt.name} 
                                      className="w-12 h-12 rounded-lg bg-gray-200 object-cover"
                                      onError={(e) => {
                                        // 이미지 로드 실패 시 플레이스홀더로 대체
                                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${alt.id}/100/100`;
                                      }}
                                    />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-gray-800">{alt.name}</h4>
                                        <p className="text-xs text-gray-400">{alt.ingredients.slice(0, 3).join(', ')}...</p>
                                    </div>
                                    <div className="text-orange-500">
                                        <CheckCircle size={20} />
                                    </div>
                                </div>
                            ))}
                            {alternatives.length === 0 && (
                                <div className="text-center text-gray-400 py-4">
                                    추천 가능한 메뉴가 없습니다.
                                </div>
                            )}
                        </div>
                        
                        <button 
                            onClick={() => setIsReplacing(false)}
                            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl font-bold"
                        >
                            취소
                        </button>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

const MealCard: React.FC<{ 
  type: string, 
  mealSet: MealSet | null, 
  onClickMain: () => void,
  onClickSide: () => void
}> = ({ type, mealSet, onClickMain, onClickSide }) => {
    if (!mealSet || (!mealSet.main && !mealSet.side)) {
        return (
            <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
                {type} 메뉴 없음
            </div>
        );
    }

    return (
        <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 space-y-2 relative z-10">
            {/* 메인음식 */}
            {mealSet.main && (
                <div 
                    onClick={onClickMain} 
                    className="flex items-center gap-3 active:scale-98 transition-transform cursor-pointer"
                >
                    <img 
                      src={`/images/recipes/${mealSet.main.id}.jpg`} 
                      alt={mealSet.main.name} 
                      className="w-12 h-12 rounded-lg object-cover bg-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${mealSet.main!.id}/100/100`;
                      }}
                    />
                    <div className="flex-1">
                        <span className="text-xs text-gray-400 font-medium block">{type} 메인</span>
                        <span className="font-bold text-gray-800">{mealSet.main.name}</span>
                    </div>
                </div>
            )}
            
            {/* 반찬 */}
            {mealSet.side && (
                <div 
                    onClick={onClickSide} 
                    className="flex items-center gap-3 active:scale-98 transition-transform cursor-pointer border-t border-gray-100 pt-2"
                >
                    <img 
                      src={`/images/recipes/${mealSet.side.id}.jpg`} 
                      alt={mealSet.side.name} 
                      className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${mealSet.side!.id}/100/100`;
                      }}
                    />
                    <div className="flex-1">
                        <span className="text-xs text-gray-400 font-medium block">반찬</span>
                        <span className="font-semibold text-sm text-gray-700">{mealSet.side.name}</span>
                    </div>
                </div>
            )}
        </div>
    )
}

export default PlanPage;