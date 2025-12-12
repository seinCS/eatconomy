import OpenAI from 'openai';
import { z } from 'zod';
import { Recipe, UserPreferences, MealSet, WeeklyPlan, DailyPlan } from '../types';
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
 * Zod 스키마: 주간 식단표 구조 (1 Cook, 2 Eat 모델)
 */
const WeeklyPlanSchema = z.object({
  // 이번 주 고정 반찬 (일주일 내내 먹을 것)
  stapleSideDishes: z.array(
    z.object({
      recipeId: z.number().int(),
      reasoning: z.string().describe('이 반찬을 선택한 이유'),
    })
  ).min(3).max(4),
  
  // 일자별 저녁 메뉴 (7일)
  dinnerPlans: z.array(
    z.object({
      day: z.number().int().min(0).max(6), // 0=월요일, 6=일요일
      mainRecipeId: z.number().int(),
      recommendedSideDishIds: z.array(z.number().int()).min(1).max(2), // 고정 반찬 중 추천
      reasoning: z.string().describe('이 메뉴를 선택한 이유'),
      // 점심 처리 정보
      lunchRecipeId: z.number().int().nullable().optional().describe('첫날(day 0) 점심 간편식 레시피 ID, 또는 재가열 불가능한 메뉴일 경우 간편식 레시피 ID'),
      isLeftoverSuitable: z.boolean().optional().describe('이 저녁 메뉴가 다음날 점심 leftovers로 적합한지 여부 (라면, 면 요리 등은 false)'),
    })
  ).length(7), // 정확히 7개 (저녁만)
});

type WeeklyPlanResponse = z.infer<typeof WeeklyPlanSchema>;

/**
 * LLM 기반 주간 식단 생성 (1 Cook, 2 Eat 모델)
 * - 저녁 메뉴 7개 추천
 * - 주간 고정 반찬 3-4개 추천
 * - 점심은 전날 저녁 leftovers 또는 간편식
 */
export const generateWeeklyPlanWithLLM = async (
  fridgeItems: string[],
  preferences: UserPreferences | undefined,
  dislikedRecipes: Recipe[],
  likedRecipes: Recipe[]
): Promise<WeeklyPlan> => {
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

  // 1. 필터링: 알러지 및 비선호 레시피 제외
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

  // 1-3. 메인/반찬 엄격 분리
  const mainCandidates = candidateRecipes.filter(r => r.dishType === 'main');
  const sideCandidates = candidateRecipes.filter(r => r.dishType === 'side');

  console.log('[OpenAI] 메인 후보 레시피 수:', mainCandidates.length);
  console.log('[OpenAI] 반찬 후보 레시피 수:', sideCandidates.length);

  // 2. 레시피 데이터베이스 요약 (메인/반찬 분리)
  const mainRecipeSummary = mainCandidates.map(r => {
    const nonStapleIngredients = r.ingredients.filter(ing => !(STAPLES as readonly string[]).includes(ing));
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
    
    return {
      id: r.id,
      name: r.name, // 정확한 메뉴명 유지
      dishType: r.dishType, // 레시피 데이터의 dishType 필드 사용
      mealType,
      calories: r.calories,
      matchRatio: Math.round(matchRatio),
      isLiked: likedIds.includes(r.id),
      tags: r.tags, // 태그 정보 추가 (국물/반찬 구분용)
    };
  }).sort((a, b) => {
    if (a.isLiked && !b.isLiked) return -1;
    if (!a.isLiked && b.isLiked) return 1;
    return b.matchRatio - a.matchRatio;
  });

  const sideRecipeSummary = sideCandidates.map(r => {
    const nonStapleIngredients = r.ingredients.filter(ing => !(STAPLES as readonly string[]).includes(ing));
    const matchCount = nonStapleIngredients.filter(ing => fridgeItems.includes(ing)).length;
    const matchRatio = nonStapleIngredients.length > 0 ? (matchCount / nonStapleIngredients.length) * 100 : 0;
    
    return {
      id: r.id,
      name: r.name,
      dishType: r.dishType, // 'side'
      calories: r.calories,
      matchRatio: Math.round(matchRatio),
      isLiked: likedIds.includes(r.id),
      tags: r.tags,
    };
  }).sort((a, b) => {
    if (a.isLiked && !b.isLiked) return -1;
    if (!a.isLiked && b.isLiked) return 1;
    return b.matchRatio - a.matchRatio;
  });

  // 3. 자취생 멘토 페르소나 프롬프트
  const systemPrompt = `Role: 당신은 '최소한의 노동으로 그럴듯하게 먹고 사는' 10년 차 프로 자취러입니다.

Objective:
1. 사용자의 냉장고 재료를 최대한 활용할 것
2. [Cook Once, Eat Twice]: 저녁 메뉴는 2인분 기준으로 요리하되, 재가열 가능한 메뉴만 다음날 점심 leftovers로 사용한다.
   - 재가열 적합: 찌개, 국물, 볶음, 조림 등 (#국물, #볶음, #조림 태그)
   - 재가열 부적합: 라면, 면 요리, 초간단 요리 등 (#면, #초간단 태그) → 다음날 점심은 간편식 추천
3. [Weekly Banchan]: 일주일 동안 두고 먹을 수 있는 '밑반찬' 3-4가지를 먼저 선정한다. 반찬은 #반찬, #볶음, #무침, #조림 태그를 가진 레시피 중에서 선택한다.
4. [Harmony]: 메인 요리가 '국물/찌개' (#국물 태그)라면 밑반찬은 눅눅해지지 않는 '볶음/무침/조림'류로 구성한다. 국+국 조합은 절대 금지다.
5. [첫날 점심]: 첫날(월요일) 점심은 간편식 레시피를 추천한다 (#초간단, #간단, #한그릇 태그).
6. 알러지 제외: ${allergenList.length > 0 ? allergenList.join(', ') : '없음'}
7. 고려사항: 재료매칭률, 좋아요 레시피 우선 선택

메인 요리 후보 (저녁 메뉴용, dishType=main):
${mainRecipeSummary.map(r => 
  `${r.id}:${r.name}(${r.mealType},${r.calories}kcal,매칭${r.matchRatio}%${r.isLiked ? ',좋아요' : ''},태그:${r.tags?.join('/') || ''})`
).join(' ')}

반찬 후보 (주간 고정 반찬용, dishType=side):
${sideRecipeSummary.map(r => 
  `${r.id}:${r.name}(${r.calories}kcal,매칭${r.matchRatio}%${r.isLiked ? ',좋아요' : ''},태그:${r.tags?.join('/') || ''})`
).join(' ')}

냉장고: ${fridgeItems.join(',')}
좋아요ID: ${likedIds.length > 0 ? likedIds.join(',') : '없음'}
싫어요ID: ${dislikedIds.length > 0 ? dislikedIds.join(',') : '없음'}

출력 형식:
1. stapleSideDishes: 주간 고정 반찬 3-4개 (recipeId, reasoning)
   - 반드시 "반찬 후보"에서만 선택하세요. 메인 요리 후보에서 선택하면 안 됩니다!
2. dinnerPlans: 저녁 메뉴 7개 (day:0-6, mainRecipeId, recommendedSideDishIds: 고정 반찬 중 1-2개, reasoning, lunchRecipeId, isLeftoverSuitable)
   - mainRecipeId: 반드시 "메인 요리 후보"에서만 선택하세요. 반찬 후보에서 선택하면 안 됩니다!
   - recommendedSideDishIds: 반드시 stapleSideDishes에 포함된 반찬 ID만 사용하세요.
   - lunchRecipeId: 
     * 첫날(day 0): 반드시 간편식 레시피 ID 제공 (필수! null 불가!) - 메인 요리 후보 중 #초간단, #간단, #한그릇 태그
     * 다른 날(day 1-6): 재가열 불가능한 메뉴일 경우에만 간편식 레시피 ID 제공, 그 외는 null
   - isLeftoverSuitable: 이 저녁 메뉴가 다음날 점심 leftovers로 적합한지 (라면, 면 요리 등은 false)

중요 규칙 (엄격히 준수):
- 메인 요리(mainRecipeId)는 반드시 "메인 요리 후보"에서만 선택하세요. 반찬 후보에서 선택하면 안 됩니다!
- 반찬(stapleSideDishes)은 반드시 "반찬 후보"에서만 선택하세요. 메인 요리 후보에서 선택하면 안 됩니다!
- 첫날(day 0)은 반드시 lunchRecipeId에 간편식 레시피 ID를 제공해야 합니다. (#초간단, #간단, #한그릇 태그) null로 설정하면 안 됩니다!
- 메인이 #국물 태그를 가지면, 반찬은 #국물 태그가 없는 것만 추천하세요.
- #면, #초간단 태그를 가진 메뉴는 isLeftoverSuitable=false로 설정하고, 다음날 점심이 필요한 경우 lunchRecipeId에 간편식 레시피 ID를 제공하세요.
- 다른 날(day 1-6)은 일반적으로 lunchRecipeId를 null로 설정하고, 전날 저녁 leftovers를 사용합니다.`;

  try {
    console.log('[OpenAI] API 호출 시작...');
    console.log('[OpenAI] 전체 후보 레시피 수:', candidateRecipes.length);
    console.log('[OpenAI] 메인 후보 레시피 수:', mainCandidates.length);
    console.log('[OpenAI] 반찬 후보 레시피 수:', sideCandidates.length);
    console.log('[OpenAI] 프롬프트 길이:', systemPrompt.length, '자');
    
    // 5. OpenAI API 호출 (structured output with JSON Schema)
    const startTime = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: '주간 고정 반찬 3-4개와 저녁 메뉴 7개를 생성하세요.\n\n중요: 첫날(day 0) 점심은 반드시 간편식 레시피 ID를 lunchRecipeId에 제공해야 합니다. 다른 날(day 1-6) 점심은 전날 저녁 leftovers이므로 lunchRecipeId는 null로 설정하되, 재가열 불가능한 메뉴(라면, 면 요리 등)일 경우에만 간편식 레시피 ID를 제공하세요.',
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
              stapleSideDishes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    recipeId: { type: 'integer' },
                    reasoning: { type: 'string' },
                  },
                  required: ['recipeId', 'reasoning'],
                  additionalProperties: false,
                },
                minItems: 3,
                maxItems: 4,
              },
              dinnerPlans: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'integer', minimum: 0, maximum: 6 },
                    mainRecipeId: { type: 'integer' },
                    recommendedSideDishIds: {
                      type: 'array',
                      items: { type: 'integer' },
                      minItems: 1,
                      maxItems: 2,
                    },
                    reasoning: { type: 'string' },
                    lunchRecipeId: { 
                      type: ['integer', 'null'],
                      description: '첫날(day 0) 점심 간편식 레시피 ID, 또는 재가열 불가능한 메뉴일 경우 간편식 레시피 ID'
                    },
                    isLeftoverSuitable: { 
                      type: 'boolean',
                      description: '이 저녁 메뉴가 다음날 점심 leftovers로 적합한지 여부'
                    },
                  },
                  required: ['day', 'mainRecipeId', 'recommendedSideDishIds', 'reasoning', 'lunchRecipeId', 'isLeftoverSuitable'],
                  additionalProperties: false,
                },
                minItems: 7,
                maxItems: 7,
              },
            },
            required: ['stapleSideDishes', 'dinnerPlans'],
            additionalProperties: false,
          },
          strict: true,
        },
      },
      temperature: 0.7,
    });
    
    const apiTime = Date.now() - startTime;
    console.log('[OpenAI] API 호출 완료:', apiTime, 'ms');
    console.log('[OpenAI] 응답 토큰 사용량:', completion.usage);

    // 6. 응답 파싱 및 검증
    const responseContent = completion.choices[0].message.content;
    console.log('[OpenAI] 응답 내용 길이:', responseContent?.length || 0);
    
    if (!responseContent || typeof responseContent !== 'string') {
      console.error('[OpenAI] 응답 내용이 유효하지 않음:', responseContent);
      throw new Error('Invalid response content from OpenAI');
    }
    
    // 응답 내용 일부 로깅 (너무 길면 잘라서)
    const previewLength = 500;
    console.log('[OpenAI] 응답 미리보기:', 
      responseContent.length > previewLength 
        ? responseContent.substring(0, previewLength) + '...'
        : responseContent
    );
    
    let parsedResponse: WeeklyPlanResponse;
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log('[OpenAI] JSON 파싱 성공');
    } catch (parseError) {
      console.error('[OpenAI] JSON 파싱 실패:', parseError);
      console.error('[OpenAI] 원본 응답:', responseContent);
      throw new Error(`Failed to parse OpenAI response: ${parseError}`);
    }
    
    console.log('[OpenAI] 파싱된 고정 반찬 수:', parsedResponse?.stapleSideDishes?.length || 0);
    console.log('[OpenAI] 파싱된 저녁 메뉴 수:', parsedResponse?.dinnerPlans?.length || 0);
    
    if (!parsedResponse?.stapleSideDishes || parsedResponse.stapleSideDishes.length < 3) {
      console.error('[OpenAI] 고정 반찬 수 부족:', parsedResponse?.stapleSideDishes?.length);
      throw new Error(`Invalid response format from OpenAI: expected 3-4 staple side dishes, got ${parsedResponse?.stapleSideDishes?.length || 0}`);
    }
    
    if (!parsedResponse?.dinnerPlans || parsedResponse.dinnerPlans.length !== 7) {
      console.error('[OpenAI] 저녁 메뉴 수 불일치:', parsedResponse?.dinnerPlans?.length);
      throw new Error(`Invalid response format from OpenAI: expected 7 dinner plans, got ${parsedResponse?.dinnerPlans?.length || 0}`);
    }

    // Zod 스키마로 검증
    console.log('[OpenAI] Zod 스키마 검증 시작...');
    const validated = WeeklyPlanSchema.parse(parsedResponse);
    console.log('[OpenAI] Zod 스키마 검증 완료');

    // 7. WeeklyPlan 구조로 변환
    console.log('[OpenAI] WeeklyPlan 변환 시작...');
    const missingRecipeIds: number[] = [];

    // 고정 반찬 변환
    const stapleSideDishes: Recipe[] = [];
    for (const item of validated.stapleSideDishes) {
      const recipe = SEED_RECIPES.find(r => r.id === item.recipeId);
      if (recipe) {
        stapleSideDishes.push({
          ...recipe,
          reason: item.reasoning,
        });
        console.log(`[OpenAI] 고정 반찬: ${recipe.name} (ID: ${item.recipeId})`);
      } else {
        console.warn(`[OpenAI] 반찬 레시피 ID ${item.recipeId}를 찾을 수 없습니다.`);
        missingRecipeIds.push(item.recipeId);
      }
    }

    // 일자별 계획 변환
    const dailyPlans: DailyPlan[] = [];
    for (const dinnerPlan of validated.dinnerPlans) {
      const mainRecipe = mainCandidates.find(r => r.id === dinnerPlan.mainRecipeId);
      if (!mainRecipe) {
        console.warn(`[OpenAI] 메인 레시피 ID ${dinnerPlan.mainRecipeId}를 찾을 수 없거나 메인 후보에 없습니다.`);
        missingRecipeIds.push(dinnerPlan.mainRecipeId);
        continue;
      }
      
      // dishType 검증
      if (mainRecipe.dishType !== 'main') {
        console.warn(`[OpenAI] 메인으로 선택된 레시피가 반찬 타입입니다: ${mainRecipe.name} (ID: ${dinnerPlan.mainRecipeId}, dishType: ${mainRecipe.dishType})`);
      }

      // 추천 반찬 찾기
      const recommendedSides = dinnerPlan.recommendedSideDishIds
        .map(id => stapleSideDishes.find(s => s.id === id))
        .filter((r): r is Recipe => r !== undefined);

      // 점심 처리 로직
      let lunchType: 'LEFTOVER' | 'COOK' | 'EAT_OUT' = 'LEFTOVER';
      let lunchRecipe: Recipe | undefined = undefined;
      let targetRecipeId: number | undefined = undefined;

      if (dinnerPlan.day === 0) {
        // 첫날: 간편식 레시피 추천 (필수)
        lunchType = 'COOK';
        if (dinnerPlan.lunchRecipeId) {
          const lunchRecipeCandidate = SEED_RECIPES.find(r => r.id === dinnerPlan.lunchRecipeId);
          if (lunchRecipeCandidate) {
            lunchRecipe = lunchRecipeCandidate;
            console.log(`[OpenAI] Day ${dinnerPlan.day} 점심 (LLM 제공): ${lunchRecipe.name} (ID: ${dinnerPlan.lunchRecipeId})`);
          } else {
            console.warn(`[OpenAI] Day ${dinnerPlan.day} 점심 레시피 ID ${dinnerPlan.lunchRecipeId}를 찾을 수 없습니다. 폴백 사용.`);
          }
        } else {
          console.warn(`[OpenAI] Day ${dinnerPlan.day} 점심 lunchRecipeId가 제공되지 않았습니다. 폴백 사용.`);
        }
      } else {
        // 다른 날: 전날 저녁 leftovers 또는 간편식
        const previousDayDinner = validated.dinnerPlans.find(p => p.day === dinnerPlan.day - 1);
        if (previousDayDinner && previousDayDinner.isLeftoverSuitable !== false) {
          // 전날 저녁이 leftovers 적합하면 leftovers 사용
          lunchType = 'LEFTOVER';
          targetRecipeId = previousDayDinner.mainRecipeId;
        } else if (previousDayDinner && previousDayDinner.isLeftoverSuitable === false) {
          // 전날 저녁이 leftovers 부적합한 경우
          if (dinnerPlan.lunchRecipeId) {
            // LLM이 간편식을 제공한 경우 (메인 후보에서 찾기)
            lunchType = 'COOK';
            const lunchRecipeCandidate = mainCandidates.find(r => r.id === dinnerPlan.lunchRecipeId);
            if (lunchRecipeCandidate) {
              lunchRecipe = lunchRecipeCandidate;
            } else {
              console.warn(`[OpenAI] Day ${dinnerPlan.day} 점심 레시피 ID ${dinnerPlan.lunchRecipeId}를 메인 후보에서 찾을 수 없습니다.`);
            }
          } else {
            // LLM이 간편식을 제공하지 않았으면 점심 없음 (외식 또는 간단히 해결)
            lunchType = 'EAT_OUT';
            lunchRecipe = undefined;
            targetRecipeId = undefined;
            console.log(`[OpenAI] Day ${dinnerPlan.day} 점심: 전날 저녁이 재가열 불가능하므로 점심 없음 (외식/간단히 해결)`);
          }
        } else {
          // 전날 저녁이 없는 경우 (이론적으로 발생하지 않아야 함)
          lunchType = 'EAT_OUT';
          lunchRecipe = undefined;
          targetRecipeId = undefined;
        }
      }

      // lunchRecipe가 없으면 간편식 레시피 자동 선택 (폴백) - 단, EAT_OUT 타입은 제외
      if (lunchType === 'COOK' && !lunchRecipe) {
        // 메인 후보에서 간편식 찾기 (점심용이므로 저녁과 겹쳐도 OK)
        let simpleMeals: typeof mainCandidates = mainCandidates.filter(r => 
          r.tags.some(t => t.includes('#초간단') || t.includes('#간단') || t.includes('#한그릇')) &&
          r.calories < 500
        );
        
        // 메인 후보에 없으면 칼로리 조건 완화
        if (simpleMeals.length === 0) {
          simpleMeals = mainCandidates.filter(r => 
            r.tags.some(t => t.includes('#초간단') || t.includes('#간단') || t.includes('#한그릇'))
          );
        }
        
        // 여전히 없으면 칼로리 조건만으로 메인 후보에서 선택
        if (simpleMeals.length === 0) {
          simpleMeals = mainCandidates.filter(r => r.calories < 400);
        }
        
        if (simpleMeals.length > 0) {
          lunchRecipe = simpleMeals[0];
          console.log(`[OpenAI] Day ${dinnerPlan.day} 점심 폴백: ${lunchRecipe.name} (ID: ${lunchRecipe.id})`);
        } else {
          console.error(`[OpenAI] Day ${dinnerPlan.day} 점심 간편식 레시피를 찾을 수 없습니다!`);
        }
      }
      
      // 첫날 점심은 반드시 있어야 함 (최종 보장)
      if (dinnerPlan.day === 0) {
        if (lunchType !== 'COOK' || !lunchRecipe) {
          console.error(`[OpenAI] 첫날 점심이 설정되지 않았습니다! Type: ${lunchType}, Recipe: ${lunchRecipe ? lunchRecipe.name : 'null'}`);
          // 강제로 간편식으로 변경
          lunchType = 'COOK';
          
          // 최후의 수단: 계란말이 또는 참치마요덮밥
          let emergencyLunch = SEED_RECIPES.find(r => {
            if (r.id === 108 || r.id === 124) { // 계란말이 또는 참치마요덮밥
              // 알러지 체크만
              return !r.ingredients.some(ing => allergenList.includes(ing));
            }
            return false;
          });
          
          if (!emergencyLunch) {
            // 메인 후보에서 더 넓은 범위로 찾기
            emergencyLunch = mainCandidates.find(r => 
              r.tags.some(t => t.includes('#초간단') || t.includes('#간단')) &&
              r.calories < 500 &&
              !r.ingredients.some(ing => allergenList.includes(ing))
            );
          }
          
          if (emergencyLunch) {
            lunchRecipe = emergencyLunch;
            console.log(`[OpenAI] 첫날 점심 긴급 폴백: ${lunchRecipe.name} (ID: ${lunchRecipe.id})`);
          } else {
            console.error(`[OpenAI] 첫날 점심 긴급 폴백도 실패했습니다!`);
          }
        }
      }

      // 첫날 점심 최종 검증 (dailyPlans.push 전)
      if (dinnerPlan.day === 0 && (!lunchRecipe || lunchType !== 'COOK')) {
        console.error(`[OpenAI] 첫날 점심이 여전히 설정되지 않았습니다! 최종 검증 실패.`);
        // 강제로 기본값 설정
        lunchType = 'COOK';
        if (!lunchRecipe) {
          const defaultLunch = SEED_RECIPES.find(r => r.id === 108); // 계란말이
          if (defaultLunch) {
            lunchRecipe = defaultLunch;
            console.log(`[OpenAI] 첫날 점심 기본값 설정: ${lunchRecipe.name} (ID: ${lunchRecipe.id})`);
          }
        }
      }

      dailyPlans.push({
        day: dinnerPlan.day,
        lunch: {
          type: lunchType,
          targetRecipeId: lunchType === 'LEFTOVER' ? targetRecipeId : undefined,
          recipe: lunchType === 'COOK' ? lunchRecipe : undefined,
        },
        dinner: {
          mainRecipe: {
            ...mainRecipe,
            reason: dinnerPlan.reasoning,
          },
          recommendedSideDishIds: recommendedSides.map(s => s.id),
        },
      });

      console.log(`[OpenAI] Day ${dinnerPlan.day} 저녁: ${mainRecipe.name} (ID: ${dinnerPlan.mainRecipeId})`);
      if (lunchRecipe) {
        console.log(`[OpenAI] Day ${dinnerPlan.day} 점심: ${lunchRecipe.name} (ID: ${lunchRecipe.id}, Type: ${lunchType})`);
      } else if (lunchType === 'LEFTOVER') {
        console.log(`[OpenAI] Day ${dinnerPlan.day} 점심: Leftover (전날 저녁 ID: ${targetRecipeId})`);
      } else {
        console.warn(`[OpenAI] Day ${dinnerPlan.day} 점심: 없음 (Type: ${lunchType})`);
      }
    }
    
    if (missingRecipeIds.length > 0) {
      console.warn('[OpenAI] 찾을 수 없는 레시피 ID:', missingRecipeIds);
    }

    // 8. 누락된 항목 채우기 (폴백)
    const usedRecipeIds = new Set<number>();
    stapleSideDishes.forEach(r => usedRecipeIds.add(r.id));
    dailyPlans.forEach(dp => {
      if (dp.dinner.mainRecipe) usedRecipeIds.add(dp.dinner.mainRecipe.id);
    });

    // 고정 반찬이 3개 미만이면 채우기 (반찬 후보에서만)
    while (stapleSideDishes.length < 3) {
      const availableSides = sideCandidates.filter(
        r => !usedRecipeIds.has(r.id)
      );
      if (availableSides.length > 0) {
        const fallback = availableSides[0];
        stapleSideDishes.push(fallback);
        usedRecipeIds.add(fallback.id);
        console.log(`[OpenAI] 고정 반찬 폴백 추가: ${fallback.name} (ID: ${fallback.id}, dishType: ${fallback.dishType})`);
      } else {
        break;
      }
    }

    // 저녁 메뉴가 없으면 채우기
    for (let day = 0; day < 7; day++) {
      const existingPlan = dailyPlans.find(dp => dp.day === day);
      if (!existingPlan || !existingPlan.dinner.mainRecipe) {
        const availableMains = mainCandidates.filter(
          r => !usedRecipeIds.has(r.id)
        );
        if (availableMains.length > 0) {
          const fallback = availableMains[0];
          
          // 점심 처리 (폴백)
          let lunchType: 'LEFTOVER' | 'COOK' | 'EAT_OUT' = day === 0 ? 'COOK' : 'LEFTOVER';
          let lunchRecipe: Recipe | undefined = undefined;
          let targetRecipeId: number | undefined = undefined;
          
          if (day === 0) {
            // 첫날: 간편식 (필수)
            let simpleMeals = candidateRecipes.filter(r => 
              !usedRecipeIds.has(r.id) &&
              r.tags.some(t => t.includes('#초간단') || t.includes('#간단') || t.includes('#한그릇')) &&
              r.calories < 500
            );
            
            // 메인 후보에 없으면 칼로리 조건 완화
            if (simpleMeals.length === 0) {
              simpleMeals = mainCandidates.filter(r => 
                !usedRecipeIds.has(r.id) &&
                r.tags.some(t => t.includes('#초간단') || t.includes('#간단') || t.includes('#한그릇'))
              );
            }
            
            if (simpleMeals.length > 0) {
              lunchRecipe = simpleMeals[0];
              usedRecipeIds.add(lunchRecipe.id);
              console.log(`[OpenAI] Day ${day} 점심 폴백 (누락 채우기): ${lunchRecipe.name} (ID: ${lunchRecipe.id})`);
            } else {
              console.error(`[OpenAI] Day ${day} 점심 간편식 레시피를 찾을 수 없습니다!`);
            }
          } else {
            // 다른 날: 전날 저녁 leftovers
            const prevDayPlan = dailyPlans.find(dp => dp.day === day - 1);
            if (prevDayPlan?.dinner?.mainRecipe) {
              targetRecipeId = prevDayPlan.dinner.mainRecipe.id;
            }
          }
          
          if (!existingPlan) {
            dailyPlans.push({
              day,
              lunch: {
                type: lunchType,
                targetRecipeId: lunchType === 'LEFTOVER' ? targetRecipeId : undefined,
                recipe: lunchType === 'COOK' ? lunchRecipe : undefined,
              },
              dinner: {
                mainRecipe: fallback,
                recommendedSideDishIds: stapleSideDishes.slice(0, 1).map(s => s.id),
              },
            });
          } else {
            existingPlan.dinner.mainRecipe = fallback;
            if (existingPlan.dinner.recommendedSideDishIds.length === 0) {
              existingPlan.dinner.recommendedSideDishIds = stapleSideDishes.slice(0, 1).map(s => s.id);
            }
            // 점심도 업데이트
            if (!existingPlan.lunch.recipe && lunchType === 'COOK' && lunchRecipe) {
              existingPlan.lunch.type = 'COOK';
              existingPlan.lunch.recipe = lunchRecipe;
            } else if (lunchType === 'LEFTOVER' && targetRecipeId) {
              existingPlan.lunch.type = 'LEFTOVER';
              existingPlan.lunch.targetRecipeId = targetRecipeId;
            }
          }
          usedRecipeIds.add(fallback.id);
        }
      }
    }

    // 일자별 계획 정렬 (day 순서대로)
    dailyPlans.sort((a, b) => a.day - b.day);

    const weeklyPlan: WeeklyPlan = {
      stapleSideDishes,
      dailyPlans,
    };

    console.log('[OpenAI] WeeklyPlan 변환 완료');
    console.log('[OpenAI] 고정 반찬:', stapleSideDishes.map(s => s.name).join(', '));
    console.log('[OpenAI] 저녁 메뉴:', dailyPlans.map(dp => `Day ${dp.day}: ${dp.dinner.mainRecipe.name}`).join(', '));

    return weeklyPlan;

  } catch (error) {
    console.error('OpenAI Plan Generation Error:', error);
    
    // 에러 발생 시 기존 스코어링 알고리즘으로 폴백 (LLM 테스트용 주석처리)
    // console.warn('Falling back to scored algorithm due to LLM error');
    throw error; // LLM만 사용하므로 에러를 그대로 전파
  }
};

