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
 * 식단 슬롯: 메인음식 + 반찬 세트
 */
export interface MealSet {
  main: Recipe | null;
  side: Recipe | null;
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
