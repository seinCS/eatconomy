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
      tags: r.tags, // 태그 정보 추가 (국물/반찬 구분용)
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
2. [Cook Once, Eat Twice]: 저녁 메뉴는 2인분 기준으로 요리하여, 다음 날 점심까지 먹는 것을 기본으로 한다. (따라서 점심 메뉴는 별도로 추천하지 않고 저녁 메뉴와 동일하게 설정한다)
3. [Weekly Banchan]: 일주일 동안 두고 먹을 수 있는 '밑반찬' 3-4가지를 먼저 선정한다. 반찬은 #반찬, #볶음, #무침, #조림 태그를 가진 레시피 중에서 선택한다.
4. [Harmony]: 메인 요리가 '국물/찌개' (#국물 태그)라면 밑반찬은 눅눅해지지 않는 '볶음/무침/조림'류로 구성한다. 국+국 조합은 절대 금지다.
5. 알러지 제외: ${allergenList.length > 0 ? allergenList.join(', ') : '없음'}
6. 고려사항: 재료매칭률, 좋아요 레시피 우선 선택

레시피 DB:
${recipeDbSummary.map(r => 
  `${r.id}:${r.name}(${r.dishType}/${r.mealType},${r.calories}kcal,매칭${r.matchRatio}%${r.isLiked ? ',좋아요' : ''},태그:${r.tags?.join('/') || ''})`
).join(' ')}

냉장고: ${fridgeItems.join(',')}
좋아요ID: ${likedIds.length > 0 ? likedIds.join(',') : '없음'}
싫어요ID: ${dislikedIds.length > 0 ? dislikedIds.join(',') : '없음'}

출력 형식:
1. stapleSideDishes: 주간 고정 반찬 3-4개 (recipeId, reasoning)
2. dinnerPlans: 저녁 메뉴 7개 (day:0-6, mainRecipeId, recommendedSideDishIds: 고정 반찬 중 1-2개, reasoning)

중요: 메인이 #국물 태그를 가지면, 반찬은 #국물 태그가 없는 것만 추천하세요.`;

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
          content: '주간 고정 반찬 3-4개와 저녁 메뉴 7개를 생성하세요. 점심은 전날 저녁 leftovers이므로 별도 추천하지 않습니다.',
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
                  },
                  required: ['day', 'mainRecipeId', 'recommendedSideDishIds', 'reasoning'],
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
      const mainRecipe = SEED_RECIPES.find(r => r.id === dinnerPlan.mainRecipeId);
      if (!mainRecipe) {
        console.warn(`[OpenAI] 메인 레시피 ID ${dinnerPlan.mainRecipeId}를 찾을 수 없습니다.`);
        missingRecipeIds.push(dinnerPlan.mainRecipeId);
        continue;
      }

      // 추천 반찬 찾기
      const recommendedSides = dinnerPlan.recommendedSideDishIds
        .map(id => stapleSideDishes.find(s => s.id === id))
        .filter((r): r is Recipe => r !== undefined);

      // 점심: 전날 저녁 leftovers (첫날 제외)
      const lunchType = dinnerPlan.day === 0 ? 'COOK' : 'LEFTOVER';
      const previousDayDinner = dinnerPlan.day > 0 
        ? validated.dinnerPlans.find(p => p.day === dinnerPlan.day - 1)
        : null;

      dailyPlans.push({
        day: dinnerPlan.day,
        lunch: {
          type: lunchType,
          targetRecipeId: lunchType === 'LEFTOVER' && previousDayDinner 
            ? previousDayDinner.mainRecipeId 
            : undefined,
          recipe: lunchType === 'COOK' ? undefined : undefined, // 간편식은 나중에 처리
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

    // 고정 반찬이 3개 미만이면 채우기
    while (stapleSideDishes.length < 3) {
      const availableSides = candidateRecipes.filter(
        r => !usedRecipeIds.has(r.id) && 
        (r.dishType === 'side' || r.tags.some(t => t.includes('#반찬') || t.includes('#볶음') || t.includes('#무침') || t.includes('#조림')))
      );
      if (availableSides.length > 0) {
        const fallback = availableSides[0];
        stapleSideDishes.push(fallback);
        usedRecipeIds.add(fallback.id);
      } else {
        break;
      }
    }

    // 저녁 메뉴가 없으면 채우기
    for (let day = 0; day < 7; day++) {
      const existingPlan = dailyPlans.find(dp => dp.day === day);
      if (!existingPlan || !existingPlan.dinner.mainRecipe) {
        const availableMains = candidateRecipes.filter(
          r => !usedRecipeIds.has(r.id) && 
          (r.dishType === 'main' || !r.dishType)
        );
        if (availableMains.length > 0) {
          const fallback = availableMains[0];
          if (!existingPlan) {
            dailyPlans.push({
              day,
              lunch: { type: day === 0 ? 'COOK' : 'LEFTOVER', targetRecipeId: day > 0 ? validated.dinnerPlans.find(p => p.day === day - 1)?.mainRecipeId : undefined },
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

