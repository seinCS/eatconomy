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

  // 2. 레시피 데이터베이스 요약 (간결한 형식)
  const recipeDbSummary = candidateRecipes.map(r => {
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
      dishType,
      mealType,
      calories: r.calories,
      matchRatio: Math.round(matchRatio),
      isLiked: likedIds.includes(r.id),
    };
  }).sort((a, b) => {
    if (a.isLiked && !b.isLiked) return -1;
    if (!a.isLiked && b.isLiked) return 1;
    return b.matchRatio - a.matchRatio;
  });

  // 3. 간결한 시스템 프롬프트
  const systemPrompt = `7일 식단표 생성 (14끼: 점심/저녁 × 7일). 레시피 DB에서만 선택하세요.

규칙:
1. 각 끼니: 메인 1개 + 반찬 1개(선택)
2. 알러지 제외: ${allergenList.length > 0 ? allergenList.join(', ') : '없음'}
3. 고려시항: 재료매칭률, 좋아요 레시피, 점심(가벼운)/저녁(든든한)
4. 재료 전략: 같은 날 반복 최소화, 다른 날 연결 최대화
5. 매운맛: ${preferences?.spicinessLevel === 1 ? '순한맛만' : '제한없음'}

레시피 DB:
${recipeDbSummary.map(r => 
  `${r.id}:${r.name}(${r.dishType}/${r.mealType},${r.calories}kcal,매칭${r.matchRatio}%${r.isLiked ? ',좋아요' : ''})`
).join(' ')}

냉장고: ${fridgeItems.join(',')}
좋아요ID: ${likedIds.length > 0 ? likedIds.join(',') : '없음'}
싫어요ID: ${dislikedIds.length > 0 ? dislikedIds.join(',') : '없음'}

출력: 14개 식사(day:0-6, mealType:lunch/dinner, mainRecipeId, sideRecipeId, reasoning)`;

  try {
    console.log('[OpenAI] API 호출 시작...');
    console.log('[OpenAI] 후보 레시피 수:', candidateRecipes.length);
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
          content: '14개 식사 생성 (day:0-6, mealType:lunch/dinner, mainRecipeId, sideRecipeId, reasoning)',
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
                      oneOf: [
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
    
    let parsedResponse: { weeklyPlan: WeeklyPlanResponse['weeklyPlan'] };
    try {
      parsedResponse = JSON.parse(responseContent);
      console.log('[OpenAI] JSON 파싱 성공');
    } catch (parseError) {
      console.error('[OpenAI] JSON 파싱 실패:', parseError);
      console.error('[OpenAI] 원본 응답:', responseContent);
      throw new Error(`Failed to parse OpenAI response: ${parseError}`);
    }
    
    console.log('[OpenAI] 파싱된 식사 수:', parsedResponse?.weeklyPlan?.length || 0);
    
    if (!parsedResponse?.weeklyPlan || parsedResponse.weeklyPlan.length !== 14) {
      console.error('[OpenAI] 식사 수 불일치:', parsedResponse?.weeklyPlan?.length);
      throw new Error(`Invalid response format from OpenAI: expected 14 meals, got ${parsedResponse?.weeklyPlan?.length || 0}`);
    }

    // Zod 스키마로 검증
    console.log('[OpenAI] Zod 스키마 검증 시작...');
    const validated = WeeklyPlanSchema.parse(parsedResponse);
    console.log('[OpenAI] Zod 스키마 검증 완료');

    // 7. MealSet[] 구조로 변환 (레시피 DB의 정확한 형식 준수)
    console.log('[OpenAI] MealSet 변환 시작...');
    const mealSets: MealSet[] = Array(14).fill(null).map(() => ({ main: null, side: null }));
    const missingRecipeIds: number[] = [];

    for (const item of validated.weeklyPlan) {
      const slotIndex = item.day * 2 + (item.mealType === 'lunch' ? 0 : 1);
      
      // 메인 레시피 찾기 (ID로 정확히 매칭)
      const mainRecipe = SEED_RECIPES.find(r => r.id === item.mainRecipeId);
      if (mainRecipe) {
        // 원본 레시피 데이터를 그대로 사용 (메뉴명, 재료명 등 정확히 유지)
        mealSets[slotIndex].main = {
          ...mainRecipe,
          reason: item.reasoning,
        };
        console.log(`[OpenAI] 슬롯${slotIndex} 메인: ${mainRecipe.name} (ID: ${item.mainRecipeId})`);
      } else {
        console.warn(`[OpenAI] 메인 레시피 ID ${item.mainRecipeId}를 찾을 수 없습니다.`);
        missingRecipeIds.push(item.mainRecipeId);
      }

      // 반찬 레시피 찾기 (ID로 정확히 매칭)
      if (item.sideRecipeId !== null) {
        const sideRecipe = SEED_RECIPES.find(r => r.id === item.sideRecipeId);
        if (sideRecipe) {
          // 원본 레시피 데이터를 그대로 사용
          mealSets[slotIndex].side = {
            ...sideRecipe,
            reason: item.reasoning,
          };
          console.log(`[OpenAI] 슬롯${slotIndex} 반찬: ${sideRecipe.name} (ID: ${item.sideRecipeId})`);
        } else {
          console.warn(`[OpenAI] 반찬 레시피 ID ${item.sideRecipeId}를 찾을 수 없습니다.`);
          missingRecipeIds.push(item.sideRecipeId);
        }
      } else {
        console.log(`[OpenAI] 슬롯${slotIndex} 반찬: null (반찬 없음)`);
      }
    }
    
    if (missingRecipeIds.length > 0) {
      console.warn('[OpenAI] 찾을 수 없는 레시피 ID:', missingRecipeIds);
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
    
    // 에러 발생 시 기존 스코어링 알고리즘으로 폴백 (LLM 테스트용 주석처리)
    // console.warn('Falling back to scored algorithm due to LLM error');
    throw error; // LLM만 사용하므로 에러를 그대로 전파
  }
};

