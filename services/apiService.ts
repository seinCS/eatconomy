import { Recipe, UserPreferences, User } from '../types';
import { apiClient } from './apiClient';
import { SEED_RECIPES, WEEKLY_PLAN_SLOTS } from '../constants';
import { logError } from '../utils/errors';

/**
 * API 서비스 - 백엔드 API 호출로 데이터 관리
 * dbService.ts의 모든 함수를 API 호출로 대체
 */
export const apiService = {
  /**
   * 사용자 초기화 (백엔드에서 자동 처리되므로 빈 함수)
   */
  initUserData: async (user: User): Promise<void> => {
    // 백엔드에서 사용자 정보는 OAuth 콜백 시 자동으로 생성됨
    // 추가 초기화가 필요하면 여기서 처리
  },

  /**
   * 사용자 정보 조회
   */
  getUser: async (userId: string): Promise<User | null> => {
    try {
      const userData = await apiClient.get<{
        id: string;
        email: string;
        nickname: string;
        avatarUrl: string | null;
        provider: string;
        preferences: {
          allergies: string[];
          dislikedFoods: string[];
          spicinessLevel: number;
          cookingSkill: string;
        } | null;
      }>('/users/me');

      return {
        id: userData.id,
        email: userData.email,
        nickname: userData.nickname,
        avatarUrl: userData.avatarUrl || '',
        preferences: userData.preferences || undefined,
      };
    } catch (error) {
      logError(error, 'getUser');
      return null;
    }
  },

  /**
   * 사용자 선호도 업데이트
   */
  updateUserPreferences: async (userId: string, prefs: UserPreferences): Promise<void> => {
    await apiClient.put('/users/me/preferences', prefs);
  },

  /**
   * 냉장고 재료 조회
   */
  getFridge: async (userId: string): Promise<string[]> => {
    try {
      const response = await apiClient.get<{ items: string[] }>('/fridge');
      return response.items;
    } catch (error) {
      logError(error, 'getFridge');
      return [];
    }
  },

  /**
   * 냉장고 재료 토글
   */
  toggleFridgeItem: async (userId: string, item: string): Promise<string[]> => {
    try {
      const response = await apiClient.put<{ items: string[] }>(`/fridge/${encodeURIComponent(item)}/toggle`);
      return response.items;
    } catch (error) {
      logError(error, 'toggleFridgeItem');
      throw error;
    }
  },

  /**
   * 좋아요한 레시피 조회
   */
  getLikedRecipes: async (userId: string): Promise<Recipe[]> => {
    try {
      const response = await apiClient.get<{ recipeIds: number[] }>('/recipes/liked');
      return SEED_RECIPES.filter(r => response.recipeIds.includes(r.id));
    } catch (error) {
      logError(error, 'getLikedRecipes');
      return [];
    }
  },

  /**
   * 레시피 좋아요 추가
   */
  addLikedRecipe: async (userId: string, recipeId: number): Promise<void> => {
    try {
      await apiClient.post(`/recipes/${recipeId}/like`);
    } catch (error) {
      logError(error, 'addLikedRecipe');
      throw error;
    }
  },

  /**
   * 싫어요한 레시피 조회
   */
  getDislikedRecipes: async (userId: string): Promise<Recipe[]> => {
    try {
      const response = await apiClient.get<{ recipeIds: number[] }>('/recipes/disliked');
      return SEED_RECIPES.filter(r => response.recipeIds.includes(r.id));
    } catch (error) {
      logError(error, 'getDislikedRecipes');
      return [];
    }
  },

  /**
   * 레시피 싫어요 추가
   */
  addDislikedRecipe: async (userId: string, recipeId: number): Promise<void> => {
    try {
      await apiClient.post(`/recipes/${recipeId}/dislike`);
    } catch (error) {
      logError(error, 'addDislikedRecipe');
      throw error;
    }
  },

  /**
   * 식단표 조회
   */
  getPlan: async (userId: string): Promise<(Recipe | null)[]> => {
    try {
      const response = await apiClient.get<{ plans: (number | null)[] }>('/plans');
      // recipeId 배열을 Recipe 객체 배열로 변환
      return response.plans.map(recipeId => 
        recipeId ? SEED_RECIPES.find(r => r.id === recipeId) || null : null
      );
    } catch (error) {
      logError(error, 'getPlan');
      return Array(WEEKLY_PLAN_SLOTS).fill(null);
    }
  },

  /**
   * 식단표 저장 (전체 업데이트)
   */
  savePlan: async (userId: string, newPlan: (Recipe | null)[]): Promise<void> => {
    try {
      const recipeIds = newPlan.map(recipe => recipe?.id || null);
      await apiClient.post('/plans', { recipeIds });
    } catch (error) {
      logError(error, 'savePlan');
      throw error;
    }
  },

  /**
   * 식단표 슬롯 업데이트
   */
  updatePlanSlot: async (userId: string, index: number, recipe: Recipe): Promise<void> => {
    try {
      await apiClient.put(`/plans/${index}`, { recipeId: recipe.id });
    } catch (error) {
      logError(error, 'updatePlanSlot');
      throw error;
    }
  },

  /**
   * 장보기 체크리스트 조회
   */
  getShoppingChecks: async (userId: string): Promise<Record<string, boolean>> => {
    try {
      const response = await apiClient.get<{ checks: Record<string, boolean> }>('/shopping-list');
      return response.checks;
    } catch (error) {
      logError(error, 'getShoppingChecks');
      return {};
    }
  },

  /**
   * 장보기 체크리스트 토글
   */
  toggleShoppingCheck: async (userId: string, item: string): Promise<Record<string, boolean>> => {
    try {
      const response = await apiClient.put<{ checks: Record<string, boolean> }>(
        `/shopping-list/${encodeURIComponent(item)}/toggle`
      );
      return response.checks;
    } catch (error) {
      logError(error, 'toggleShoppingCheck');
      throw error;
    }
  },

  /**
   * 오늘의 저녁 완료 상태 조회 (레거시)
   */
  getTodayFinished: async (userId: string): Promise<boolean> => {
    try {
      const response = await apiClient.get<{ finished: boolean }>('/meals/today');
      return response.finished;
    } catch (error) {
      logError(error, 'getTodayFinished');
      return false;
    }
  },

  /**
   * 오늘의 저녁 완료 상태 토글 (레거시)
   */
  toggleTodayFinished: async (userId: string): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await apiClient.put<{ finished: boolean }>(
        `/meals/finished/${today}/dinner`
      );
      return response.finished;
    } catch (error) {
      logError(error, 'toggleTodayFinished');
      throw error;
    }
  },

  /**
   * 식사 완료 상태 조회
   */
  getMealFinished: async (
    userId: string,
    dateKey: string,
    mealType: 'lunch' | 'dinner'
  ): Promise<boolean> => {
    try {
      const response = await apiClient.get<{ finished: boolean }>(
        `/meals/finished/${dateKey}/${mealType}`
      );
      return response.finished;
    } catch (error) {
      logError(error, 'getMealFinished');
      return false;
    }
  },

  /**
   * 식사 완료 상태 토글
   */
  toggleMealFinished: async (
    userId: string,
    dateKey: string,
    mealType: 'lunch' | 'dinner'
  ): Promise<boolean> => {
    try {
      const response = await apiClient.put<{ finished: boolean }>(
        `/meals/finished/${dateKey}/${mealType}`
      );
      return response.finished;
    } catch (error) {
      logError(error, 'toggleMealFinished');
      throw error;
    }
  },

  /**
   * 세션 리셋 (좋아요/싫어요 초기화)
   */
  resetSession: async (userId: string): Promise<void> => {
    try {
      // 좋아요/싫어요 레시피를 모두 삭제
      const likedResponse = await apiClient.get<{ recipeIds: number[] }>('/recipes/liked');
      const dislikedResponse = await apiClient.get<{ recipeIds: number[] }>('/recipes/disliked');
      
      // 모든 좋아요 삭제
      await Promise.all(
        likedResponse.recipeIds.map(recipeId =>
          apiClient.delete(`/recipes/${recipeId}/like`).catch(() => {})
        )
      );
      
      // 모든 싫어요 삭제
      await Promise.all(
        dislikedResponse.recipeIds.map(recipeId =>
          apiClient.delete(`/recipes/${recipeId}/dislike`).catch(() => {})
        )
      );
    } catch (error) {
      logError(error, 'resetSession');
      // 에러가 발생해도 계속 진행
    }
  },

  /**
   * 계정 삭제
   */
  deleteAccount: async (userId: string): Promise<void> => {
    try {
      await apiClient.delete('/users/me');
    } catch (error) {
      logError(error, 'deleteAccount');
      throw error;
    }
  },
};

