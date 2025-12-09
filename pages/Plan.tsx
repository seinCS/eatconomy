import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { DAYS } from '../constants';
import { getSharedIngredients, getAlternativeRecipes, getAllRecipes } from '../services/recipeService';
import { Clock, Link as LinkIcon, Info, Repeat, CheckCircle, TrendingUp, Flame, Leaf, Check, X, ShoppingCart } from 'lucide-react';
import { Recipe } from '../types';
import { useNavigate } from 'react-router-dom';

interface SlotData {
    recipe: Recipe;
    index: number;
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
    const validMeals = plannedRecipes.filter((r): r is Recipe => r !== null);
    
    // 1. Estimated Savings: (Meal Count * 15,000) - (Meal Count * 5,000) = Count * 10,000
    const savings = validMeals.length * 10000;

    // 2. Daily Avg Calories: Total Calories / 7
    const totalCalories = validMeals.reduce((sum, r) => sum + r.calories, 0);
    const avgCalories = Math.round(totalCalories / 7);

    // 3. Chain Count (Zero Waste Success)
    let chainCount = 0;
    for (let i = 0; i < 7; i++) {
        const lunch = plannedRecipes[i * 2];
        const dinner = plannedRecipes[i * 2 + 1];
        const prevDinner = i > 0 ? plannedRecipes[(i - 1) * 2 + 1] : null;

        // Lunch <- Prev Dinner
        if (prevDinner && lunch && getSharedIngredients(prevDinner, lunch).length > 0) {
            chainCount++;
        }
        // Dinner <- Lunch
        if (lunch && dinner && getSharedIngredients(lunch, dinner).length > 0) {
            chainCount++;
        }
    }

    return { savings, avgCalories, chainCount };
  }, [plannedRecipes]);

  const handleRecipeClick = (recipe: Recipe, index: number) => {
    setSelectedSlot({ recipe, index });
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
    const prevRecipe = index > 0 ? plannedRecipes[index - 1] : null;
    const nextRecipe = index < plannedRecipes.length - 1 ? plannedRecipes[index + 1] : null;
    
    const prevChain = prevRecipe ? getSharedIngredients(prevRecipe, selectedSlot!.recipe) : [];
    const nextChain = nextRecipe ? getSharedIngredients(selectedSlot!.recipe, nextRecipe) : [];
    
    return { prevChain, nextChain };
  };

  const handleStartReplace = () => {
      if (!selectedSlot) return;
      
      const index = selectedSlot.index;
      const prevRecipe = index > 0 ? plannedRecipes[index - 1] : null;
      
      const isLunch = index % 2 === 0;
      const otherSlotRecipe = isLunch ? plannedRecipes[index + 1] : plannedRecipes[index - 1];

      const all = getAllRecipes();
      const candidates = getAlternativeRecipes(
          selectedSlot.recipe.id, 
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
      updatePlan(selectedSlot.index, newRecipe);
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
            const lunch = plannedRecipes[lunchIndex];
            const dinner = plannedRecipes[dinnerIndex];

            // Chain Logic Check
            // 1. Previous Dinner -> Today Lunch
            let prevDinner = dayIndex > 0 ? plannedRecipes[(dayIndex-1)*2 + 1] : null;
            let chainToLunch = prevDinner && lunch ? getSharedIngredients(prevDinner, lunch) : [];

            // 2. Today Lunch -> Today Dinner
            let chainToDinner = lunch && dinner ? getSharedIngredients(lunch, dinner) : [];

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
                            recipe={lunch} 
                            onClick={() => lunch && handleRecipeClick(lunch, lunchIndex)}
                        />
                    </div>

                    {/* Connection Line Visual (Lunch -> Dinner) */}
                    {chainToDinner.length > 0 && (
                        <div className="h-6 w-full flex items-center justify-center relative">
                             <div className="h-full w-0.5 bg-green-300 absolute left-8 top-0"></div>
                             <div className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full border border-green-200 z-10 flex items-center">
                                <LinkIcon size={10} className="mr-1"/>
                                {chainToDinner.join(', ')}
                            </div>
                        </div>
                    )}

                    {/* Dinner Slot */}
                    <div className="mt-2">
                        <MealCard 
                            type="저녁" 
                            recipe={dinner} 
                            onClick={() => dinner && handleRecipeClick(dinner, dinnerIndex)}
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
                                <h2 className="text-xl font-bold mb-1">{selectedSlot.recipe.name}</h2>
                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{selectedSlot.recipe.time}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Flame size={12} />
                                        <span>{selectedSlot.recipe.calories} kcal</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedSlot(null)} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={18} />
                            </button>
                        </div>

                        {/* 재료 준비 상태 */}
                        {(() => {
                            const readiness = getRecipeReadiness(selectedSlot.recipe);
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
                        {selectedSlot.recipe.tags.length > 0 && (
                            <div className="mb-4">
                                <div className="flex flex-wrap gap-1.5">
                                    {selectedSlot.recipe.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-medium">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

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

const MealCard: React.FC<{ type: string, recipe: Recipe | null, onClick: () => void }> = ({ type, recipe, onClick }) => {
    if (!recipe) return (
        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400 text-sm">
            {type} 메뉴 없음
        </div>
    );

    return (
        <div onClick={onClick} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 active:scale-98 transition-transform cursor-pointer relative z-10">
            <img 
              src={`/images/recipes/${recipe.id}.jpg`} 
              alt={recipe.name} 
              className="w-12 h-12 rounded-lg object-cover bg-gray-200"
              onError={(e) => {
                // 이미지 로드 실패 시 플레이스홀더로 대체
                (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${recipe.id}/100/100`;
              }}
            />
            <div>
                <span className="text-xs text-gray-400 font-medium block">{type}</span>
                <span className="font-bold text-gray-800">{recipe.name}</span>
            </div>
        </div>
    )
}

export default PlanPage;