export interface Ingredient {
  name: string;
  amount?: string;
}

export interface UserPreferences {
  allergies: string[];
  dislikedFoods: string[];
  spicinessLevel: number; // 1: Mild, 2: Medium, 3: Hot
  cookingSkill: string; // 'Beginner', 'Intermediate', 'Advanced'
}

export interface Recipe {
  id: number;
  name: string;
  ingredients: string[]; // Simplified for matching logic
  tags: string[];
  time: string;
  calories: number;
  image?: string;
  reason?: string; // AI generated reason
  dishType?: 'main' | 'side'; // 메인음식 또는 반찬
  mealType?: 'lunch' | 'dinner' | 'both'; // 점심/저녁 적합성
}

export interface MealSlot {
  day: string; // "Mon", "Tue", etc.
  type: 'Lunch' | 'Dinner';
  recipeId: number | null;
}

/**
 * 식단 슬롯: 메인음식 + 반찬 세트 (레거시, 호환성 유지)
 */
export interface MealSet {
  main: Recipe | null;
  side: Recipe | null;
}

/**
 * 주간 식단 계획 (1 Cook, 2 Eat 모델)
 */
export interface WeeklyPlan {
  // 이번 주 고정 반찬 (일주일 내내 먹을 것)
  stapleSideDishes: Recipe[]; // 3-4개
  
  // 일자별 계획
  dailyPlans: DailyPlan[];
}

/**
 * 일자별 식단 계획
 */
export interface DailyPlan {
  day: number; // 0=월요일, 6=일요일
  
  // 점심: 보통 전날 저녁 leftovers 또는 간편식
  lunch: {
    type: 'LEFTOVER' | 'COOK' | 'EAT_OUT';
    targetRecipeId?: number; // LEFTOVER일 경우 전날 저녁 ID 참조
    recipe?: Recipe; // COOK 또는 EAT_OUT일 경우 레시피
  };
  
  // 저녁: 메인 요리하는 시간
  dinner: {
    mainRecipe: Recipe;
    // 고정 반찬 중 무엇을 꺼내 먹을지 추천 (조리 X, 서빙 O)
    recommendedSideDishIds: number[];
  };
}

export type SwipeDirection = 'left' | 'right';

export interface ChainConnection {
  fromId: number;
  toId: number;
  sharedIngredients: string[];
}

/**
 * 사용자 정보 타입
 */
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  preferences?: UserPreferences;
}

/**
 * API 응답 타입
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * 에러 응답 타입
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}
