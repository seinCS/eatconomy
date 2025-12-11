import OpenAI from 'openai';
import { z } from 'zod';
import { Recipe, UserPreferences, MealSet } from '../types';
import { SEED_RECIPES, STAPLES } from '../constants';

/// <reference types="vite/client" />

// Helper to get API key safely supporting Vite
const getApiKey = (): string | undefined => {
  if (import.meta.env.VITE_OPENAI_API_KEY) {
    return import.meta.env.VITE_OPENAI_API_KEY as string;
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  }
  return undefined;
};

/**
 * Zod 스키마: 주간 식단표 구조 (MealSet[])
 */
const WeeklyPlanSchema = z.object({
  weeklyPlan: z.array(
    z.object({
      day: z.number().int().min(0).max(6), // 0=월요일, 6=일요일
      mealType: z.enum(['lunch', 'dinner']),
      mainRecipeId: z.number().int(),
      sideRecipeId: z.number().int().nullable(),
      reasoning: z.string().describe('이 메뉴를 선택한 이유'),
    })
  ).length(14), // 정확히 14개 (7일 × 2끼)
});

type WeeklyPlanResponse = z.infer<typeof WeeklyPlanSchema>;

/**
 * LLM 기반 주간 식단 생성 (메인+반찬 세트)
 * 기존 스코어링 알고리즘의 로직을 프롬프트에 반영
 */
export const generateWeeklyPlanWithLLM = async (
  fridgeItems: string[],
  preferences: UserPreferences | undefined,
  dislikedRecipes: Recipe[],
  likedRecipes: Recipe[]
): Promise<MealSet[]> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('OpenAI API Key not found. Please set VITE_OPENAI_API_KEY in .env');
  }

  const openai = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true, // Vite 환경에서 브라우저 사용 허용
  });

  // 1. 안전 필터링: 알러지 및 비선호 레시피 제외
  const allergenList = preferences?.allergies || [];
  const dislikedFoodList = preferences?.dislikedFoods || [];
  const dislikedIds = dislikedRecipes.map(r => r.id);
  const likedIds = likedRecipes.map(r => r.id);

  const candidateRecipes = SEED_RECIPES.filter(recipe => {
    // 알러지 재료 포함 레시피 제외
    const hasAllergen = recipe.ingredients.some(ing => allergenList.includes(ing));
    if (hasAllergen) return false;

    // 싫어하는 재료 포함 레시피 제외
    const hasDislikedFood = recipe.ingredients.some(ing => dislikedFoodList.includes(ing));
    if (hasDislikedFood) return false;

    // 스와이프로 싫어요 선택한 레시피 제외
    if (dislikedIds.includes(recipe.id)) return false;

    return true;
  });

  // 2. 레시피 데이터베이스 요약 (메타데이터 포함)
  const recipeDbSummary = candidateRecipes.map(r => {
    const nonStapleIngredients = r.ingredients.filter(ing => !STAPLES.includes(ing));
    const matchCount = nonStapleIngredients.filter(ing => fridgeItems.includes(ing)).length;
    const matchRatio = nonStapleIngredients.length > 0 ? (matchCount / nonStapleIngredients.length) * 100 : 0;
    
    // dishType 추정
    const mainDishTags = ['#고기', '#메인', '#한그릇', '#면', '#국물', '#분식', '#빵', '#덮밥'];
    const sideDishTags = ['#반찬', '#안주'];
    const hasMainTag = r.tags.some(t => mainDishTags.some(mt => t.includes(mt)));
    const hasSideTag = r.tags.some(t => sideDishTags.some(st => t.includes(st)));
    const dishType = hasSideTag ? 'side' : (hasMainTag || r.calories >= 300 ? 'main' : 'side');
    
    // mealType 추정
    const lunchTags = ['#아침', '#브런치', '#간단', '#초간단', '#건강', '#채소'];
    const dinnerTags = ['#고기', '#메인', '#든든', '#파티'];
    const hasLunchTag = r.tags.some(t => lunchTags.some(lt => t.includes(lt)));
    const hasDinnerTag = r.tags.some(t => dinnerTags.some(dt => t.includes(dt)));
    let mealType = 'both';
    if (hasLunchTag && !hasDinnerTag) mealType = 'lunch';
    else if (hasDinnerTag && !hasLunchTag) mealType = 'dinner';
    else if (!hasLunchTag && !hasDinnerTag) {
      if (r.calories < 400) mealType = 'lunch';
      else if (r.calories > 550) mealType = 'dinner';
    }
    
    const isLiked = likedIds.includes(r.id);
    
    return {
      id: r.id,
      name: r.name,
      ingredients: r.ingredients,
      nonStapleIngredients,
      matchRatio: Math.round(matchRatio),
      matchCount,
      calories: r.calories,
      tags: r.tags,
      dishType,
      mealType,
      isLiked,
      time: r.time,
    };
  }).sort((a, b) => {
    // 좋아요 레시피 우선 정렬
    if (a.isLiked && !b.isLiked) return -1;
    if (!a.isLiked && b.isLiked) return 1;
    // 재료 매칭률 높은 순
    return b.matchRatio - a.matchRatio;
  });

  // 3. 사용자 컨텍스트 구성
  const userContext = {
    fridgeInventory: fridgeItems,
    allergies: allergenList,
    dislikedFoods: dislikedFoodList,
    spicinessLevel: preferences?.spicinessLevel || 2,
    cookingSkill: preferences?.cookingSkill || 'Beginner',
    likedRecipeIds: likedIds,
    dislikedRecipeIds: dislikedIds,
  };

  // 4. 시스템 프롬프트 작성 (기존 스코어링 로직 반영)
  const systemPrompt = `You are an expert meal planning assistant for a single-person household. Your task is to create a 7-day meal plan (14 meals: lunch and dinner for each day) by selecting recipes from the provided Recipe Database.

**CRITICAL CONSTRAINTS:**
1. SELECTION ONLY: You must ONLY select recipes from the Recipe Database. Do NOT invent new recipes.
2. MEAL STRUCTURE: Each meal must consist of:
   - 1 main dish (dishType: 'main')
   - 1 side dish (dishType: 'side', can be null if no suitable side dish available)
3. SAFETY FIRST: NEVER select recipes containing allergens: ${allergenList.length > 0 ? allergenList.join(', ') : 'None'}

**SCORING CRITERIA (Prioritize in this order):**
1. **Ingredient Matching Priority**: Prefer recipes with high matchRatio (재료 매칭률). Recipes with ingredients already in the fridge should be prioritized.
2. **Liked Recipes Bonus**: If a recipe has isLiked: true, prioritize it significantly.
3. **Meal Type Suitability**: 
   - Lunch: Prefer lighter meals (calories < 400) and recipes with mealType: 'lunch' or 'both'
   - Dinner: Prefer heartier meals (calories > 500) and recipes with mealType: 'dinner' or 'both'
4. **Ingredient Diversity Strategy**:
   - MINIMIZE ingredient repetition within the SAME day (avoid using same ingredients for lunch and dinner on the same day)
   - MAXIMIZE ingredient connection across DIFFERENT days (reuse ingredients from previous day's dinner in today's lunch for efficient cooking)
5. **Spiciness Preference**: If user's spicinessLevel is 1 (mild), avoid recipes with spicy tags (#매콤, #얼큰, #불닭, etc.)

**Recipe Database:**
${recipeDbSummary.map(r => 
  `ID: ${r.id} | Name: "${r.name}" | Type: ${r.dishType}/${r.mealType} | Ingredients: [${r.ingredients.join(', ')}] | Match: ${r.matchRatio}% | Calories: ${r.calories} | Liked: ${r.isLiked} | Tags: ${r.tags.join(', ')}`
).join('\n')}

**User Profile:**
- Fridge Inventory: ${userContext.fridgeInventory.join(', ')}
- Allergies: ${userContext.allergies.length > 0 ? userContext.allergies.join(', ') : 'None'}
- Disliked Foods: ${userContext.dislikedFoods.length > 0 ? userContext.dislikedFoods.join(', ') : 'None'}
- Spiciness Level: ${userContext.spicinessLevel}/3
- Cooking Skill: ${userContext.cookingSkill}
- Liked Recipe IDs: ${userContext.likedRecipeIds.length > 0 ? userContext.likedRecipeIds.join(', ') : 'None'}
- Disliked Recipe IDs: ${userContext.dislikedRecipeIds.length > 0 ? userContext.dislikedRecipeIds.join(', ') : 'None'}

**Output Format:**
Return a weekly plan with exactly 14 meals (7 days × 2 meals per day).
Each meal should have:
- day: 0 (Monday) to 6 (Sunday)
- mealType: 'lunch' or 'dinner'
- mainRecipeId: ID of the main dish
- sideRecipeId: ID of the side dish (can be null if no suitable side dish)
- reasoning: Brief explanation in Korean why this combination was chosen

**Important Notes:**
- Ensure variety: Don't repeat the same recipe within the week
- Balance nutrition: Mix different types of dishes (soup, stir-fry, rice bowl, etc.)
- Consider cooking efficiency: Connect ingredients across days when possible
- Respect meal type preferences: Lighter meals for lunch, heartier meals for dinner`;

  try {
    // 5. OpenAI API 호출 (structured output with JSON Schema)
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: 'Create a 7-day meal plan (14 meals total) following all the constraints and scoring criteria provided.',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'weekly_plan',
          description: 'Weekly meal plan with main and side dishes',
          schema: {
            type: 'object',
            properties: {
              weeklyPlan: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'integer', minimum: 0, maximum: 6 },
                    mealType: { type: 'string', enum: ['lunch', 'dinner'] },
                    mainRecipeId: { type: 'integer' },
                    sideRecipeId: { 
                      anyOf: [
                        { type: 'integer' },
                        { type: 'null' }
                      ]
                    },
                    reasoning: { type: 'string' },
                  },
                  required: ['day', 'mealType', 'mainRecipeId', 'sideRecipeId', 'reasoning'],
                  additionalProperties: false,
                },
                minItems: 14,
                maxItems: 14,
              },
            },
            required: ['weeklyPlan'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.7, // 창의성과 일관성의 균형
    });

    // 6. 응답 파싱 및 검증
    const parsedResponse = completion.choices[0].message.parsed as { weeklyPlan: WeeklyPlanResponse['weeklyPlan'] };
    
    if (!parsedResponse?.weeklyPlan || parsedResponse.weeklyPlan.length !== 14) {
      throw new Error(`Invalid response format from OpenAI: expected 14 meals, got ${parsedResponse?.weeklyPlan?.length || 0}`);
    }

    // Zod 스키마로 검증
    const validated = WeeklyPlanSchema.parse(parsedResponse);

    // 7. MealSet[] 구조로 변환
    const mealSets: MealSet[] = Array(14).fill(null).map(() => ({ main: null, side: null }));

    for (const item of validated.weeklyPlan) {
      const slotIndex = item.day * 2 + (item.mealType === 'lunch' ? 0 : 1);
      
      // 메인 레시피 찾기
      const mainRecipe = SEED_RECIPES.find(r => r.id === item.mainRecipeId);
      if (mainRecipe) {
        mealSets[slotIndex].main = {
          ...mainRecipe,
          reason: item.reasoning,
        };
      }

      // 반찬 레시피 찾기
      if (item.sideRecipeId !== null) {
        const sideRecipe = SEED_RECIPES.find(r => r.id === item.sideRecipeId);
        if (sideRecipe) {
          mealSets[slotIndex].side = {
            ...sideRecipe,
            reason: item.reasoning,
          };
        }
      }
    }

    // 8. 누락된 슬롯 채우기 (폴백)
    const usedRecipeIds = new Set<number>();
    mealSets.forEach(ms => {
      if (ms.main) usedRecipeIds.add(ms.main.id);
      if (ms.side) usedRecipeIds.add(ms.side.id);
    });

    for (let i = 0; i < mealSets.length; i++) {
      const day = Math.floor(i / 2);
      const mealType = i % 2 === 0 ? 'lunch' : 'dinner';
      
      // 메인이 없으면 채우기
      if (!mealSets[i].main) {
        const availableMains = candidateRecipes.filter(
          r => !usedRecipeIds.has(r.id) && 
          (r.dishType === 'main' || !r.dishType) &&
          (r.mealType === mealType || r.mealType === 'both' || !r.mealType)
        );
        if (availableMains.length > 0) {
          const fallback = availableMains[0];
          mealSets[i].main = fallback;
          usedRecipeIds.add(fallback.id);
        }
      }

      // 반찬이 없으면 채우기
      if (!mealSets[i].side) {
        const availableSides = candidateRecipes.filter(
          r => !usedRecipeIds.has(r.id) && 
          (r.dishType === 'side' || (!r.dishType && r.calories < 300))
        );
        if (availableSides.length > 0) {
          const fallback = availableSides[0];
          mealSets[i].side = fallback;
          usedRecipeIds.add(fallback.id);
        }
      }
    }

    return mealSets;

  } catch (error) {
    console.error('OpenAI Plan Generation Error:', error);
    
    // 에러 발생 시 기존 스코어링 알고리즘으로 폴백
    console.warn('Falling back to scored algorithm due to LLM error');
    throw error;
  }
};

