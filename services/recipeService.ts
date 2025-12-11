
import { SEED_RECIPES, STAPLES, WEEKLY_PLAN_SLOTS } from '../constants';
import { Recipe, UserPreferences, MealSet } from '../types';

/**
 * 레시피에 메타데이터 자동 추가 (dishType, mealType)
 */
const enrichRecipeMetadata = (recipe: Recipe): Recipe => {
  // dishType 분류: 메인 vs 반찬
  const mainDishTags = ['#고기', '#메인', '#한그릇', '#면', '#국물', '#분식', '#빵', '#덮밥', '#요리'];
  const sideDishTags = ['#반찬', '#안주'];
  
  const hasMainTag = recipe.tags.some(t => mainDishTags.some(mt => t.includes(mt)));
  const hasSideTag = recipe.tags.some(t => sideDishTags.some(st => t.includes(st)));
  
  let dishType: 'main' | 'side' = 'main'; // 기본값은 메인
  if (hasSideTag) {
    dishType = 'side';
  } else if (!hasMainTag && recipe.calories < 300) {
    // 메인 태그가 없고 칼로리가 낮으면 반찬으로 분류
    dishType = 'side';
  }
  
  // mealType 분류: 점심 vs 저녁
  const lunchTags = ['#아침', '#브런치', '#간단', '#초간단', '#건강', '#채소'];
  const dinnerTags = ['#고기', '#메인', '#든든', '#파티', '#요리'];
  
  const hasLunchTag = recipe.tags.some(t => lunchTags.some(lt => t.includes(lt)));
  const hasDinnerTag = recipe.tags.some(t => dinnerTags.some(dt => t.includes(dt)));
  
  let mealType: 'lunch' | 'dinner' | 'both' = 'both';
  if (hasLunchTag && !hasDinnerTag) {
    mealType = 'lunch';
  } else if (hasDinnerTag && !hasLunchTag) {
    mealType = 'dinner';
  } else if (!hasLunchTag && !hasDinnerTag) {
    // 태그가 없으면 칼로리로 판단
    if (recipe.calories < 400) {
      mealType = 'lunch';
    } else if (recipe.calories > 550) {
      mealType = 'dinner';
    }
  }
  
  return {
    ...recipe,
    dishType,
    mealType,
  };
};

/**
 * 메타데이터가 추가된 레시피 목록
 */
const ENRICHED_RECIPES = SEED_RECIPES.map(enrichRecipeMetadata);

export const getAllRecipes = (): Recipe[] => {
  return ENRICHED_RECIPES;
};

export const getRecipeById = (id: number): Recipe | undefined => {
  return SEED_RECIPES.find(r => r.id === id);
};

// The "Chain Cooking" Algorithm
export const getSharedIngredients = (recipeA: Recipe, recipeB: Recipe): string[] => {
  return recipeA.ingredients.filter(ing => 
    recipeB.ingredients.includes(ing) && !STAPLES.includes(ing)
  );
};

export const calculateChainScore = (currentRecipe: Recipe, fridgeIngredients: string[]): number => {
  // Score based on fridge matches
  const matchCount = currentRecipe.ingredients.filter(ing => fridgeIngredients.includes(ing)).length;
  return matchCount;
};

// Suggest next meal based on previous meal leftovers
export const suggestNextMeal = (prevRecipe: Recipe, candidates: Recipe[]): Recipe | null => {
  const scoredCandidates = candidates.map(candidate => {
    const shared = getSharedIngredients(prevRecipe, candidate);
    return {
      recipe: candidate,
      score: shared.length
    };
  });

  // Sort by shared ingredient count (descending)
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Add a bit of randomness to top candidates to prevent same result every time if scores are tied
  const topScore = scoredCandidates[0]?.score || 0;
  if (topScore === 0) return null;

  const topCandidates = scoredCandidates.filter(c => c.score === topScore);
  const randomPick = topCandidates[Math.floor(Math.random() * topCandidates.length)];

  return randomPick.recipe;
};

// --- NEW: Slot-specific Replacement with Options ---
export const getAlternativeRecipes = (
  currentId: number | undefined, 
  prevRecipe: Recipe | null,
  otherSlotRecipe: Recipe | null, // Lunch if Dinner, Dinner if Lunch
  allRecipes: Recipe[],
  dislikedRecipes: Recipe[]
): Recipe[] => {
  const dislikedIds = dislikedRecipes.map(r => r.id);
  const otherSlotId = otherSlotRecipe ? otherSlotRecipe.id : -1;

  // 1. Filter candidates: Exclude current, disliked, and same day duplicate
  let candidates = allRecipes.filter(r => 
    r.id !== currentId && 
    !dislikedIds.includes(r.id) &&
    r.id !== otherSlotId
  );

  // 2. Score candidates based on Chain Cooking (if prev exists)
  if (prevRecipe) {
    candidates = candidates.sort((a, b) => {
        const scoreA = getSharedIngredients(prevRecipe, a).length;
        const scoreB = getSharedIngredients(prevRecipe, b).length;
        return scoreB - scoreA;
    });
  } else {
    // If no prev recipe, shuffle to random
    candidates = candidates.sort(() => 0.5 - Math.random());
  }

  // 3. Return top 3 unique
  return candidates.slice(0, 3);
};

export const generateShoppingList = (plannedRecipes: MealSet[], fridgeInventory: string[]): { name: string, count: number }[] => {
  const allIngredients: string[] = [];
  
  plannedRecipes.forEach(mealSet => {
    // 메인과 반찬 모두의 재료 수집
    [mealSet.main, mealSet.side].forEach(r => {
      if (r) {
        r.ingredients.forEach(ing => {
          if (!STAPLES.includes(ing)) {
            allIngredients.push(ing);
          }
        });
      }
    });
  });

  const needToBuy: Record<string, number> = {};
  
  allIngredients.forEach(ing => {
    if (!fridgeInventory.includes(ing)) {
        needToBuy[ing] = (needToBuy[ing] || 0) + 1;
    }
  });

  return Object.entries(needToBuy).map(([name, count]) => ({ name, count }));
};

// Centralized Plan Generation (Legacy Random - Kept for fallback)
export const generateFullWeekPlan = (
    likedRecipes: Recipe[], 
    dislikedRecipes: Recipe[],
    allRecipes: Recipe[]
): (Recipe | null)[] => {
  
  const dislikedIds = dislikedRecipes.map(r => r.id);
  const validAllRecipes = allRecipes.filter(r => !dislikedIds.includes(r.id));
  const validLikedRecipes = likedRecipes.filter(r => !dislikedIds.includes(r.id));

  const newPlan: (Recipe | null)[] = Array(WEEKLY_PLAN_SLOTS).fill(null);
  let likedIdx = 0;

  if (validLikedRecipes.length > 0) {
      for (let i = 0; i < 14; i += 2) {
          if (likedIdx < validLikedRecipes.length) {
              newPlan[i] = validLikedRecipes[likedIdx];
              likedIdx++;
          }
      }
  }

  for (let i = 0; i < 14; i++) {
      if (!newPlan[i]) {
          if (i > 0 && newPlan[i-1]) {
              const prev = newPlan[i-1]!;
              const candidates = validAllRecipes.filter(r => r.id !== prev.id);
              const next = suggestNextMeal(prev, candidates);
              
              if (next) {
                  newPlan[i] = next;
                  continue;
              }
          }
          const prevId = i > 0 ? newPlan[i-1]?.id : -1;
          const randomPool = validAllRecipes.filter(r => r.id !== prevId);
          newPlan[i] = randomPool[Math.floor(Math.random() * randomPool.length)];
      }
  }
  
  return newPlan;
};

// --- Phase 5: Enhanced Weekly Plan Generation (Main+Side Set, Improved Chain Logic) ---
export const generateScoredWeeklyPlan = (
  fridgeItems: string[],
  preferences: UserPreferences | undefined,
  dislikedRecipes: Recipe[],
  likedRecipes: Recipe[] // Added to prioritize user selection
): MealSet[] => {
  const allRecipes = ENRICHED_RECIPES;
  const allergenList = preferences?.allergies || [];
  const dislikedFoodList = preferences?.dislikedFoods || [];
  const dislikedIds = dislikedRecipes.map(r => r.id);
  const likedIds = likedRecipes.map(r => r.id);
  const spicinessLevel = preferences?.spicinessLevel || 2; 

  // Create a safe pool for fallbacks (exclude allergies and dislikes)
  const safePool = allRecipes.filter(r => 
      !r.ingredients.some(ing => allergenList.includes(ing)) &&
      !r.ingredients.some(ing => dislikedFoodList.includes(ing)) &&
      !dislikedIds.includes(r.id)
  );

  // If safePool is too small, relax dislike constraints but keep allergy checks
  const fallbackPool = safePool.length > 0 ? safePool : allRecipes.filter(r => !r.ingredients.some(ing => allergenList.includes(ing)));

  // 1. Scoring & Filtering
  let candidates = allRecipes.map(recipe => {
    // Hard Filter: Allergies
    if (recipe.ingredients.some(ing => allergenList.includes(ing))) return null;
    
    // Hard Filter: Disliked Foods
    if (recipe.ingredients.some(ing => dislikedFoodList.includes(ing))) return null;

    // Hard Filter: Disliked Recipes
    if (dislikedIds.includes(recipe.id)) return null;

    // --- Scoring Logic ---
    // Exclude staples from scoring logic
    const nonStapleIngredients = recipe.ingredients.filter(ing => !STAPLES.includes(ing));
    const totalIngredients = nonStapleIngredients.length || 1; 
    
    const matches = nonStapleIngredients.filter(ing => fridgeItems.includes(ing)).length;
    const missing = totalIngredients - matches;

    // Base Scores
    const matchScore = (matches / totalIngredients) * 100;
    const missingPenalty = missing * 10;
    
    // Spiciness Penalty
    let spicinessPenalty = 0;
    const isSpicy = recipe.tags.some(t => ['#매콤', '#얼큰', '#불닭', '#청양', '#매운'].some(k => t.includes(k)));
    if (spicinessLevel === 1 && isSpicy) {
        spicinessPenalty = 50;
    }

    // Liked Bonus (Swipe Result)
    let likedBonus = 0;
    if (likedIds.includes(recipe.id)) {
        likedBonus = 1000; // Huge bonus to ensure it gets picked
    }

    const totalScore = matchScore - missingPenalty - spicinessPenalty + likedBonus;

    return { recipe, score: totalScore };
  }).filter((item): item is { recipe: Recipe, score: number } => item !== null);

  // Sort by Score Descending
  candidates.sort((a, b) => b.score - a.score);

  // 2. 메인/반찬 분리
  const mainDishes = candidates.filter(c => c.recipe.dishType === 'main' || !c.recipe.dishType);
  const sideDishes = candidates.filter(c => c.recipe.dishType === 'side');
  
  // 3. 7일 식단 생성 (메인+반찬 세트)
  const mealSets: MealSet[] = []; // 14개 세트 (점심/저녁 × 7일)
  const usedRecipeIds = new Set<number>();
  const usedIngredientsByDay: string[][] = Array(7).fill(null).map(() => []); // 날짜별 사용된 재료 추적
  
  // 각 날짜별로 메인+반찬 세트 생성
  for (let day = 0; day < 7; day++) {
    const lunchIndex = day * 2; // 점심 슬롯 인덱스
    const dinnerIndex = day * 2 + 1; // 저녁 슬롯 인덱스
    
    // 점심 메인 선택
    const lunchMain = selectRecipeForSlot(
      mainDishes,
      'lunch',
      lunchIndex,
      mealSets.map(m => m.main).filter((r): r is Recipe => r !== null),
      usedRecipeIds,
      usedIngredientsByDay,
      day,
      likedIds,
      fridgeItems
    );
    usedRecipeIds.add(lunchMain.id);
    updateUsedIngredients(lunchMain, usedIngredientsByDay[day]);
    
    // 점심 반찬 선택 (메인과 함께 고려)
    const lunchSide = selectRecipeForSlot(
      sideDishes,
      'lunch',
      lunchIndex,
      [...mealSets.map(m => m.main), ...mealSets.map(m => m.side)].filter((r): r is Recipe => r !== null),
      usedRecipeIds,
      usedIngredientsByDay,
      day,
      likedIds,
      fridgeItems
    );
    usedRecipeIds.add(lunchSide.id);
    updateUsedIngredients(lunchSide, usedIngredientsByDay[day]);
    
    // 저녁 메인 선택
    const dinnerMain = selectRecipeForSlot(
      mainDishes,
      'dinner',
      dinnerIndex,
      mealSets.map(m => m.main).filter((r): r is Recipe => r !== null),
      usedRecipeIds,
      usedIngredientsByDay,
      day,
      likedIds,
      fridgeItems
    );
    usedRecipeIds.add(dinnerMain.id);
    updateUsedIngredients(dinnerMain, usedIngredientsByDay[day]);
    
    // 저녁 반찬 선택 (메인과 함께 고려)
    const dinnerSide = selectRecipeForSlot(
      sideDishes,
      'dinner',
      dinnerIndex,
      [...mealSets.map(m => m.main), ...mealSets.map(m => m.side)].filter((r): r is Recipe => r !== null),
      usedRecipeIds,
      usedIngredientsByDay,
      day,
      likedIds,
      fridgeItems
    );
    usedRecipeIds.add(dinnerSide.id);
    updateUsedIngredients(dinnerSide, usedIngredientsByDay[day]);
    
    // 세트 추가
    mealSets.push(
      { main: lunchMain, side: lunchSide }, // 점심 세트
      { main: dinnerMain, side: dinnerSide } // 저녁 세트
    );
  }
  
  // 반환: 14개 MealSet (점심/저녁 × 7일)
  return mealSets;
};

/**
 * 슬롯에 맞는 레시피 선택 (개선된 알고리즘)
 */
function selectRecipeForSlot(
  candidates: Array<{ recipe: Recipe, score: number }>,
  mealType: 'lunch' | 'dinner',
  slotIndex: number,
  selectedMeals: Recipe[],
  usedRecipeIds: Set<number>,
  usedIngredientsByDay: string[][],
  currentDay: number,
  likedIds: number[],
  fridgeItems: string[]
): Recipe {
  // 필터링: 사용되지 않은 레시피만
  let validCandidates = candidates.filter(c => !usedRecipeIds.has(c.recipe.id));
  
  // 점심/저녁 적합성 필터링
  validCandidates = validCandidates.filter(c => {
    const recipeMealType = c.recipe.mealType || 'both';
    return recipeMealType === mealType || recipeMealType === 'both';
  });
  
  if (validCandidates.length === 0) {
    // Fallback: 모든 레시피에서 선택
    const allCandidates = candidates.filter(c => !usedRecipeIds.has(c.recipe.id));
    if (allCandidates.length > 0) {
      return allCandidates[0].recipe;
    }
    return ENRICHED_RECIPES[0]; // 최후의 수단
  }
  
  // 점수 계산 (개선된 로직)
  const scored = validCandidates.map(c => {
    let finalScore = c.score;
    
    // 1. 하루 내 재료 반복 패널티 (같은 날 이미 사용된 재료와 겹치면 감점)
    const currentDayIngredients = usedIngredientsByDay[currentDay];
    const sharedWithToday = getSharedIngredients(
      { ingredients: currentDayIngredients } as Recipe,
      c.recipe
    );
    const sameDayPenalty = sharedWithToday.length * 30; // 하루 내 반복은 큰 패널티
    finalScore -= sameDayPenalty;
    
    // 2. 다른 날 재료 연결 보너스 (이전 날 저녁과 재료가 겹치면 가산점)
    if (currentDay > 0) {
      const prevDayIngredients = usedIngredientsByDay[currentDay - 1];
      const sharedWithPrevDay = getSharedIngredients(
        { ingredients: prevDayIngredients } as Recipe,
        c.recipe
      );
      const crossDayBonus = sharedWithPrevDay.length * 20; // 다른 날 연결은 보너스
      finalScore += crossDayBonus;
    }
    
    // 3. 점심/저녁 적합성 보너스
    const recipeMealType = c.recipe.mealType || 'both';
    if (recipeMealType === mealType) {
      finalScore += 50; // 정확히 맞는 타입이면 보너스
    }
    
    // 4. 칼로리 기반 적합성 (점심은 낮은 칼로리, 저녁은 높은 칼로리 선호)
    if (mealType === 'lunch' && c.recipe.calories < 400) {
      finalScore += 30;
    } else if (mealType === 'dinner' && c.recipe.calories > 500) {
      finalScore += 30;
    }
    
    return { recipe: c.recipe, score: finalScore };
  });
  
  // 점수 순으로 정렬
  scored.sort((a, b) => b.score - a.score);
  
  // 상위 5개 중 랜덤 선택 (다양성 확보)
  const topN = Math.min(scored.length, 5);
  const selected = scored[Math.floor(Math.random() * topN)];
  
  return selected.recipe;
}

/**
 * 사용된 재료 추적 업데이트
 */
function updateUsedIngredients(recipe: Recipe, dayIngredients: string[]): void {
  const nonStapleIngredients = recipe.ingredients.filter(ing => !STAPLES.includes(ing));
  nonStapleIngredients.forEach(ing => {
    if (!dayIngredients.includes(ing)) {
      dayIngredients.push(ing);
    }
  });
}
