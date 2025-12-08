
import { SEED_RECIPES, STAPLES } from '../constants';
import { Recipe, UserPreferences } from '../types';

export const getAllRecipes = (): Recipe[] => {
  return SEED_RECIPES;
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

export const generateShoppingList = (plannedRecipes: Recipe[], fridgeInventory: string[]): { name: string, count: number }[] => {
  const allIngredients: string[] = [];
  
  plannedRecipes.forEach(r => {
    r.ingredients.forEach(ing => {
      if (!STAPLES.includes(ing)) {
        allIngredients.push(ing);
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

  const newPlan: (Recipe | null)[] = Array(14).fill(null);
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

// --- Phase 4: Scored Weekly Plan Generation (Cost-Optimized & Preference Aware) ---
export const generateScoredWeeklyPlan = (
  fridgeItems: string[],
  preferences: UserPreferences | undefined,
  dislikedRecipes: Recipe[],
  likedRecipes: Recipe[] // Added to prioritize user selection
): Recipe[] => {
  const allRecipes = SEED_RECIPES;
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

  // 2. Selection (Diversity Logic)
  // Take Top 30 pool (or all if less)
  const pool = candidates.slice(0, 30);
  
  const selectedRecipes: Recipe[] = [];
  const tagCounts: Record<string, number> = {};
  const MAX_TAG_REPEAT = 3; 

  for (let i = 0; i < 14; i++) {
      if (pool.length === 0) break;

      // Filter pool for current slot constraints
      const validCandidates = pool.filter(c => {
          // Prevent duplicates in plan
          if (selectedRecipes.some(r => r.id === c.recipe.id)) return false;
          
          // Check Tag Limits
          const significantTags = c.recipe.tags.filter(t => 
              ['#면', '#고기', '#국물', '#분식', '#빵', '#튀김'].some(k => t.includes(k))
          );
          for (const t of significantTags) {
              if ((tagCounts[t] || 0) >= MAX_TAG_REPEAT) return false;
          }
          return true;
      });

      let picked: { recipe: Recipe, score: number };

      if (validCandidates.length > 0) {
          // Weighted Shuffle: Pick from top 5 valid candidates randomly
          // If the top candidate has a super high score (liked recipe), it's very likely to be in top 5
          const topN = Math.min(validCandidates.length, 5);
          const pickIdx = Math.floor(Math.random() * topN);
          picked = validCandidates[pickIdx];
      } else {
          // Fallback
          const fallback = pool.find(c => !selectedRecipes.some(r => r.id === c.recipe.id));
          if (fallback) {
              picked = fallback;
          } else {
              // Should not happen if fallback logic is correct below, but just in case
              picked = { recipe: fallbackPool[0] || SEED_RECIPES[0], score: 0 };
          }
      }

      selectedRecipes.push(picked.recipe);

      // Update Tag Counts
      picked.recipe.tags.forEach(t => {
           if (['#면', '#고기', '#국물', '#분식', '#빵', '#튀김'].some(k => t.includes(k))) {
               tagCounts[t] = (tagCounts[t] || 0) + 1;
           }
      });
  }
  
  // Fill remaining slots if any using safe fallback pool
  while (selectedRecipes.length < 14) {
      if (fallbackPool.length > 0) {
        selectedRecipes.push(fallbackPool[Math.floor(Math.random() * fallbackPool.length)]);
      } else {
        // Absolute last resort if everything is allergic (unlikely given seed data)
        selectedRecipes.push(SEED_RECIPES[Math.floor(Math.random() * SEED_RECIPES.length)]);
      }
  }

  // Attach Reason
  return selectedRecipes.map(r => ({
      ...r,
      reason: likedIds.includes(r.id) ? "직접 선택한 선호 메뉴" : "재료 매칭 및 선호도 분석 결과"
  }));
};
