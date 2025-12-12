import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { DAYS } from '../constants';
import { getSharedIngredients, getAlternativeRecipes, getAllRecipes } from '../services/recipeService';
import { Clock, Link as LinkIcon, Info, Repeat, CheckCircle, TrendingUp, Flame, Leaf, Check, X, ShoppingCart } from 'lucide-react';
import { Recipe, WeeklyPlan, DailyPlan } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, PanInfo } from 'framer-motion';

interface SlotData {
    dailyPlan: DailyPlan;
    day: number;
    isMain: boolean; // 메인인지 반찬인지
    isSideFromStaple: boolean; // 고정 반찬에서 온 반찬인지
    sideRecipeId?: number; // 반찬 레시피 ID (고정 반찬 중 하나)
    isLunch?: boolean; // 점심 메뉴인지 여부
    lunchRecipe?: Recipe; // 점심 레시피 (점심 메뉴인 경우)
    isRecommendedSide?: boolean; // 추천 반찬인지 여부 (주간 식단 내에서의 추천 반찬)
}

const PlanPage: React.FC = () => {
  const { plannedRecipes, updatePlan, dislikedRecipes, fridge } = useApp();
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  
  // Re-roll state
  const [isReplacing, setIsReplacing] = useState(false);
  const [alternatives, setAlternatives] = useState<Recipe[]>([]);
  
  // Drag and drop state
  const [draggedDay, setDraggedDay] = useState<number | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // --- Real-time Dashboard Logic ---
  const dashboardStats = useMemo(() => {
    if (!plannedRecipes) return { savings: 0, avgCalories: 0, chainCount: 0 };
    
    // 모든 메인과 반찬을 합쳐서 계산
    const allRecipes: Recipe[] = [];
    
    // 고정 반찬 추가
    plannedRecipes.stapleSideDishes.forEach(side => allRecipes.push(side));
    
    // 일자별 저녁 메인 추가
    plannedRecipes.dailyPlans.forEach(dp => {
      if (dp.dinner.mainRecipe) allRecipes.push(dp.dinner.mainRecipe);
    });
    
    // 1. Estimated Savings: (Meal Count * 15,000) - (Meal Count * 5,000) = Count * 10,000
    const savings = allRecipes.length * 10000;

    // 2. Daily Avg Calories: Total Calories / 7
    const totalCalories = allRecipes.reduce((sum, r) => sum + r.calories, 0);
    const avgCalories = Math.round(totalCalories / 7);

    // 3. Chain Count (Zero Waste Success) - 다른 날 재료 연결성 확인
    // 점심은 전날 저녁 leftovers이므로 자동으로 연결됨
    let chainCount = 0;
    for (let i = 1; i < 7; i++) {
        const todayDinner = plannedRecipes.dailyPlans[i]?.dinner?.mainRecipe;
        const prevDinner = plannedRecipes.dailyPlans[i - 1]?.dinner?.mainRecipe;

        // 점심은 전날 저녁 leftovers이므로 항상 연결됨
        if (prevDinner && todayDinner && getSharedIngredients(prevDinner, todayDinner).length > 0) {
            chainCount++;
        }
    }

    return { savings, avgCalories, chainCount };
  }, [plannedRecipes]);

  const handleRecipeClick = (
    dailyPlan: DailyPlan, 
    day: number, 
    isMain: boolean, 
    isSideFromStaple: boolean = false, 
    sideRecipeId?: number,
    isLunch: boolean = false,
    lunchRecipe?: Recipe,
    isRecommendedSide: boolean = false
  ) => {
    setSelectedSlot({ dailyPlan, day, isMain, isSideFromStaple, sideRecipeId, isLunch, lunchRecipe, isRecommendedSide });
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
  const getChainInfo = (day: number) => {
    if (!plannedRecipes || !selectedSlot) return { prevChain: [], nextChain: [] };
    
    const currentRecipe = selectedSlot.isLunch && selectedSlot.lunchRecipe
      ? selectedSlot.lunchRecipe
      : selectedSlot.isMain 
      ? selectedSlot.dailyPlan.dinner.mainRecipe 
      : ((selectedSlot.isSideFromStaple || selectedSlot.isRecommendedSide) && selectedSlot.sideRecipeId
          ? plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId) || null
          : null);
    
    if (!currentRecipe) return { prevChain: [], nextChain: [] };
    
    const prevDayPlan = day > 0 ? plannedRecipes.dailyPlans[day - 1] : null;
    const nextDayPlan = day < 6 ? plannedRecipes.dailyPlans[day + 1] : null;
    
    // 다른 날과의 연결만 확인
    const prevRecipe = prevDayPlan?.dinner?.mainRecipe || null;
    const nextRecipe = nextDayPlan?.dinner?.mainRecipe || null;
    
    const prevChain = prevRecipe ? getSharedIngredients(prevRecipe, currentRecipe) : [];
    const nextChain = nextRecipe ? getSharedIngredients(currentRecipe, nextRecipe) : [];
    
    return { prevChain, nextChain };
  };

  const handleStartReplace = () => {
      if (!selectedSlot || !plannedRecipes) return;
      
      const day = selectedSlot.day;
      const currentRecipe = selectedSlot.isLunch && selectedSlot.lunchRecipe
        ? selectedSlot.lunchRecipe
        : selectedSlot.isMain 
        ? selectedSlot.dailyPlan.dinner.mainRecipe 
        : (selectedSlot.isSideFromStaple && selectedSlot.sideRecipeId
            ? plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId) || null
            : null);
      if (!currentRecipe) return;
      
      const prevDayPlan = day > 0 ? plannedRecipes.dailyPlans[day - 1] : null;
      const prevRecipe = prevDayPlan?.dinner?.mainRecipe || null;
      
      // 같은 날 다른 슬롯 레시피 (반찬 교체 시 저녁 메인, 점심 교체 시 저녁 메인)
      const otherSlotRecipe = selectedSlot.isLunch 
        ? selectedSlot.dailyPlan.dinner.mainRecipe 
        : selectedSlot.isMain 
        ? null 
        : selectedSlot.dailyPlan.dinner.mainRecipe;

      let candidates: Recipe[] = [];
      
      // 추천 반찬 교체: 냉장고 친구들(stapleSideDishes) 내에서만 선택
      if (selectedSlot.isRecommendedSide && selectedSlot.sideRecipeId) {
        candidates = plannedRecipes.stapleSideDishes.filter(s => s.id !== selectedSlot.sideRecipeId);
      } else {
        // 고정 반찬 교체 또는 메인/점심 교체: 전체 레시피에서 필터링
        const all = getAllRecipes();
        
        // dishType 필터링: 메인은 main만, 반찬은 side만, 점심은 main만 (간편식)
        let dishTypeFilter: 'main' | 'side' | undefined = undefined;
        if (selectedSlot.isMain) {
          dishTypeFilter = 'main';
        } else if (selectedSlot.isSideFromStaple) {
          dishTypeFilter = 'side'; // 고정 반찬 교체 시 side 타입만
        } else if (selectedSlot.isLunch) {
          dishTypeFilter = 'main'; // 점심은 간편식이므로 main 타입만
        }
        
        candidates = getAlternativeRecipes(
            currentRecipe.id, 
            prevRecipe, 
            otherSlotRecipe, 
            all, 
            dislikedRecipes,
            dishTypeFilter
        );
      }
      
      setAlternatives(candidates);
      setIsReplacing(true);
  };

  const confirmReplacement = async (newRecipe: Recipe) => {
      if (!selectedSlot || !plannedRecipes) return;
      
      const day = selectedSlot.day;
      const dailyPlan = { ...plannedRecipes.dailyPlans[day] };
      
      if (selectedSlot.isLunch) {
        // 점심 메뉴 교체
        dailyPlan.lunch.type = 'COOK';
        dailyPlan.lunch.recipe = newRecipe;
        dailyPlan.lunch.targetRecipeId = undefined;
        await updatePlan(day, dailyPlan);
      } else if (selectedSlot.isMain) {
        // 메인 교체
        dailyPlan.dinner.mainRecipe = newRecipe;
        await updatePlan(day, dailyPlan);
      } else if (selectedSlot.isRecommendedSide && selectedSlot.sideRecipeId) {
        // 추천 반찬 교체: 냉장고 친구들 내에서 선택한 반찬으로 교체
        const newRecommendedSideIds = dailyPlan.dinner.recommendedSideDishIds.map(id => 
          id === selectedSlot.sideRecipeId ? newRecipe.id : id
        );
        dailyPlan.dinner.recommendedSideDishIds = newRecommendedSideIds;
        await updatePlan(day, dailyPlan);
      } else if (selectedSlot.isSideFromStaple && selectedSlot.sideRecipeId) {
        // 고정 반찬 교체 (냉장고 친구들 박스에서 클릭한 경우)
        const newStapleSideDishes = plannedRecipes.stapleSideDishes.map(side => 
          side.id === selectedSlot.sideRecipeId ? newRecipe : side
        );
        const newPlan: WeeklyPlan = {
          ...plannedRecipes,
          stapleSideDishes: newStapleSideDishes,
        };
        setPlannedRecipes(newPlan);
        // localStorage에 저장
        if (user) {
          const { dbService } = await import('../services/dbService');
          await dbService.saveWeeklyPlan(user.id, newPlan);
        }
        setSelectedSlot(null);
        setIsReplacing(false);
        return;
      }
      
      setSelectedSlot(null);
      setIsReplacing(false);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (day: number) => {
    setDraggedDay(day);
  };

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, sourceDay: number) => {
    const dropDay = dragOverDay;
    setDraggedDay(null);
    setDragOverDay(null);
    
    if (!plannedRecipes || dropDay === null || dropDay === sourceDay) return;
    
    // 메뉴 교체
    const sourcePlan = plannedRecipes.dailyPlans[sourceDay];
    const targetPlan = plannedRecipes.dailyPlans[dropDay];
    
    if (sourcePlan.dinner.mainRecipe && targetPlan.dinner.mainRecipe) {
      // 두 날짜의 메인 메뉴 교체
      const newPlans = [...plannedRecipes.dailyPlans];
      const tempMain = sourcePlan.dinner.mainRecipe;
      newPlans[sourceDay] = {
        ...sourcePlan,
        dinner: {
          ...sourcePlan.dinner,
          mainRecipe: targetPlan.dinner.mainRecipe,
        },
      };
      newPlans[dropDay] = {
        ...targetPlan,
        dinner: {
          ...targetPlan.dinner,
          mainRecipe: tempMain,
        },
      };
      
      const newPlan: WeeklyPlan = {
        ...plannedRecipes,
        dailyPlans: newPlans,
      };
      
      setPlannedRecipes(newPlan);
      
      // 저장
      if (user) {
        try {
          const { dbService } = await import('../services/dbService');
          await dbService.saveWeeklyPlan(user.id, newPlan);
          
          // API에도 저장 (레거시)
          const { apiService } = await import('../services/apiService');
          const mainRecipes = newPlan.dailyPlans.map(dp => dp.dinner.mainRecipe);
          await apiService.savePlan(user.id, mainRecipes);
        } catch (error) {
          console.error('[Plan] 드래그 앤 드롭 저장 실패:', error);
          // 롤백
          setPlannedRecipes(plannedRecipes);
        }
      }
    }
  };

  const handleDragOver = (day: number) => {
    if (draggedDay !== null && day !== draggedDay) {
      setDragOverDay(day);
    }
  };

  const handleDragLeave = () => {
    setDragOverDay(null);
  };

  if (!plannedRecipes) {
    return (
      <div className="p-6 pb-24 min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">식단표가 없습니다.</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg font-bold"
          >
            식단 추천받기
          </button>
        </div>
      </div>
    );
  }

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

      {/* 주간 반찬존 (상단 고정) */}
      {plannedRecipes && plannedRecipes.stapleSideDishes.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
            <Leaf size={14} className="mr-1.5 text-green-600" />
            이번 주 냉장고 친구들 (고정 반찬)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {plannedRecipes.stapleSideDishes.map((side) => (
              <div
                key={side.id}
                onClick={() => {
                  // 첫 번째 날짜의 저녁에 이 반찬이 추천되어 있는지 확인
                  const firstDayPlan = plannedRecipes!.dailyPlans[0];
                  const isRecommended = firstDayPlan?.dinner?.recommendedSideDishIds?.includes(side.id);
                  handleRecipeClick(
                    firstDayPlan,
                    0,
                    false,
                    true,
                    side.id
                  );
                }}
                className="p-2 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 active:scale-98 transition-transform"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={`/images/recipes/${side.id}.jpg`}
                    alt={side.name}
                    className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${side.id}/100/100`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{side.name}</p>
                    <p className="text-[10px] text-gray-500">일주일 내내</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline View (저녁 중심) */}
      {plannedRecipes && (
        <div className="space-y-0">
          {plannedRecipes.dailyPlans.map((dailyPlan, dayIndex) => {
            const dayName = DAYS[dayIndex];
            const prevDayPlan = dayIndex > 0 ? plannedRecipes.dailyPlans[dayIndex - 1] : null;

            // Chain Logic Check: 점심은 전날 저녁 leftovers이므로 자동 연결
            const chainToLunch = prevDayPlan?.dinner?.mainRecipe && dailyPlan.lunch.type === 'LEFTOVER'
              ? getSharedIngredients(prevDayPlan.dinner.mainRecipe, dailyPlan.lunch.targetRecipeId ? plannedRecipes.dailyPlans.find(dp => dp.dinner.mainRecipe.id === dailyPlan.lunch.targetRecipeId)?.dinner.mainRecipe || prevDayPlan.dinner.mainRecipe : prevDayPlan.dinner.mainRecipe)
              : [];

            return (
              <div key={dayName} className="relative pl-8 border-l-2 border-gray-200 last:border-0 pb-8">
                {/* Day Label */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                <h3 className="text-sm font-bold text-gray-400 mb-4">{dayName}</h3>

                {/* Lunch Slot (작게 표시, LEFTOVER 강조) */}
                {dailyPlan.lunch.type !== 'EAT_OUT' && (
                  <div className="mb-3 relative">
                    {chainToLunch.length > 0 && (
                      <div className="absolute -top-6 left-4 right-0 flex justify-center z-0">
                        <div className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 flex items-center">
                          <LinkIcon size={10} className="mr-1"/>
                          {chainToLunch[0]} 연계
                        </div>
                      </div>
                    )}
                    <LunchCard
                      dailyPlan={dailyPlan}
                      lunchRecipe={
                        dailyPlan.lunch.type === 'LEFTOVER' && dailyPlan.lunch.targetRecipeId
                          ? prevDayPlan?.dinner?.mainRecipe || null
                          : dailyPlan.lunch.type === 'COOK' && dailyPlan.lunch.recipe
                          ? dailyPlan.lunch.recipe
                          : null
                      }
                      onClick={() => {
                        const targetRecipe = dailyPlan.lunch.type === 'LEFTOVER' && dailyPlan.lunch.targetRecipeId
                          ? prevDayPlan?.dinner?.mainRecipe
                          : dailyPlan.lunch.type === 'COOK' && dailyPlan.lunch.recipe
                          ? dailyPlan.lunch.recipe
                          : null;
                        if (targetRecipe) {
                          handleRecipeClick(dailyPlan, dayIndex, false, false, undefined, true, targetRecipe);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Dinner Slot (강조) */}
                <div 
                  className="mt-2"
                  onDragOver={(e) => {
                    e.preventDefault();
                    handleDragOver(dayIndex);
                  }}
                  onDragLeave={handleDragLeave}
                >
                  <DinnerCard
                    dailyPlan={dailyPlan}
                    stapleSideDishes={plannedRecipes.stapleSideDishes}
                    onClickMain={() => dailyPlan.dinner.mainRecipe && handleRecipeClick(dailyPlan, dayIndex, true)}
                    onClickSide={(sideId) => handleRecipeClick(dailyPlan, dayIndex, false, true, sideId, false, undefined, true)}
                    onDragStart={() => handleDragStart(dayIndex)}
                    onDragEnd={(e, info) => handleDragEnd(e, info, dayIndex)}
                    isDragging={draggedDay === dayIndex}
                    isDragOver={dragOverDay === dayIndex}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                                    {(() => {
                                      if (selectedSlot.isLunch && selectedSlot.lunchRecipe) {
                                        return selectedSlot.lunchRecipe.name;
                                      } else if (selectedSlot.isMain) {
                                        return selectedSlot.dailyPlan.dinner.mainRecipe?.name || '메인 없음';
                                      } else if ((selectedSlot.isSideFromStaple || selectedSlot.isRecommendedSide) && selectedSlot.sideRecipeId && plannedRecipes) {
                                        const side = plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId);
                                        return side?.name || '반찬 없음';
                                      }
                                      return '반찬 없음';
                                    })()}
                                </h2>
                                {(() => {
                                  const currentRecipe = selectedSlot.isLunch && selectedSlot.lunchRecipe
                                    ? selectedSlot.lunchRecipe
                                    : selectedSlot.isMain 
                                    ? selectedSlot.dailyPlan.dinner.mainRecipe 
                                    : ((selectedSlot.isSideFromStaple || selectedSlot.isRecommendedSide) && selectedSlot.sideRecipeId && plannedRecipes
                                        ? plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId) || null
                                        : null);
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
                            const currentRecipe = selectedSlot.isLunch && selectedSlot.lunchRecipe
                              ? selectedSlot.lunchRecipe
                              : selectedSlot.isMain 
                              ? selectedSlot.dailyPlan.dinner.mainRecipe 
                              : (selectedSlot.isSideFromStaple && selectedSlot.sideRecipeId && plannedRecipes
                                  ? plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId) || null
                                  : null);
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
                            const chainInfo = getChainInfo(selectedSlot.day);
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
                          const currentRecipe = selectedSlot.isLunch && selectedSlot.lunchRecipe
                            ? selectedSlot.lunchRecipe
                            : selectedSlot.isMain 
                            ? selectedSlot.dailyPlan.dinner.mainRecipe 
                            : (selectedSlot.isSideFromStaple && selectedSlot.sideRecipeId && plannedRecipes
                                ? plannedRecipes.stapleSideDishes.find(s => s.id === selectedSlot.sideRecipeId) || null
                                : null);
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

// 점심 카드 (작게 표시, LEFTOVER 강조)
const LunchCard: React.FC<{
  dailyPlan: DailyPlan;
  lunchRecipe: Recipe | null;
  onClick: () => void;
}> = ({ dailyPlan, lunchRecipe, onClick }) => {
  // LEFTOVER 타입: 전날 저녁 leftovers
  if (dailyPlan.lunch.type === 'LEFTOVER' && lunchRecipe) {
    return (
      <div 
        onClick={onClick}
        className="bg-gray-50 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-100 active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={`/images/recipes/${lunchRecipe.id}.jpg`}
              alt={lunchRecipe.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${lunchRecipe.id}/100/100`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 font-medium block">점심 (Leftover)</span>
            <span className="text-xs font-semibold text-gray-600 truncate">어제 저녁 남은 {lunchRecipe.name}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // COOK 타입: 간편식
  if (dailyPlan.lunch.type === 'COOK' && lunchRecipe) {
    return (
      <div 
        onClick={onClick}
        className="bg-white p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 active:scale-98 transition-transform"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={`/images/recipes/${lunchRecipe.id}.jpg`}
              alt={lunchRecipe.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${lunchRecipe.id}/100/100`;
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-gray-400 font-medium block">점심 (간편식)</span>
            <span className="text-xs font-semibold text-gray-700 truncate">{lunchRecipe.name}</span>
          </div>
        </div>
      </div>
    );
  }
  
  // EAT_OUT 타입 또는 레시피가 없는 경우: 점심 없음 (표시하지 않음)
  return null;
};

// 저녁 카드 (강조)
const DinnerCard: React.FC<{
  dailyPlan: DailyPlan;
  stapleSideDishes: Recipe[];
  onClickMain: () => void;
  onClickSide: (sideId: number) => void;
  onDragStart: () => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  isDragging: boolean;
  isDragOver: boolean;
}> = ({ dailyPlan, stapleSideDishes, onClickMain, onClickSide, onDragStart, onDragEnd, isDragging, isDragOver }) => {
  if (!dailyPlan.dinner.mainRecipe) {
    return (
      <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
        저녁 메뉴 없음
      </div>
    );
  }

  const recommendedSides = dailyPlan.dinner.recommendedSideDishIds
    .map(id => stapleSideDishes.find(s => s.id === id))
    .filter((r): r is Recipe => r !== undefined);

  return (
    <motion.div 
      className={`bg-white p-4 rounded-xl shadow-md border-2 space-y-3 relative z-10 transition-all ${
        isDragOver 
          ? 'border-orange-400 bg-orange-50' 
          : isDragging 
          ? 'border-orange-300 opacity-50' 
          : 'border-orange-100'
      }`}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
    >
      {/* 저녁 메인 (강조) */}
      <div className="flex items-center gap-3 mb-2">
        <div className="absolute -top-2 -left-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
          Cooking
        </div>
        <div 
          onClick={onClickMain} 
          className="flex items-center gap-3 active:scale-98 transition-transform cursor-pointer flex-1"
        >
          <img 
            src={`/images/recipes/${dailyPlan.dinner.mainRecipe.id}.jpg`} 
            alt={dailyPlan.dinner.mainRecipe.name} 
            className="w-14 h-14 rounded-lg object-cover bg-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dailyPlan.dinner.mainRecipe!.id}/100/100`;
            }}
          />
          <div className="flex-1">
            <span className="text-xs text-orange-600 font-bold block">저녁 메인 (2인분)</span>
            <span className="font-bold text-gray-900 text-base">{dailyPlan.dinner.mainRecipe.name}</span>
          </div>
        </div>
      </div>
      
      {/* 추천 반찬 (고정 반찬 중) */}
      {recommendedSides.length > 0 && (
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <span className="text-[10px] text-gray-400 font-medium block">추천 반찬 (냉장고에서 꺼내기)</span>
          {recommendedSides.map((side) => (
            <div 
              key={side.id}
              onClick={() => onClickSide(side.id)} 
              className="flex items-center gap-2 active:scale-98 transition-transform cursor-pointer"
            >
              <img 
                src={`/images/recipes/${side.id}.jpg`} 
                alt={side.name} 
                className="w-10 h-10 rounded-lg object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${side.id}/100/100`;
                }}
              />
              <div className="flex-1">
                <span className="font-semibold text-sm text-gray-700">{side.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PlanPage;