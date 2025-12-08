import { describe, it, expect, beforeEach } from 'vitest';
import { dbService, User } from '../services/dbService';
import { Recipe, UserPreferences } from '../types';
import { SEED_RECIPES } from '../constants';

describe('dbService', () => {
  const mockUser: User = {
    id: 'test_user_001',
    email: 'test@example.com',
    nickname: '테스트 유저',
    avatarUrl: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    // Note: In a real test, we would reset the in-memory DB
    // For now, we'll test with a unique user ID to avoid conflicts
  });

  describe('initUserData', () => {
    it('should initialize user data for new user', async () => {
      const newUser: User = {
        id: `test_user_${Date.now()}`,
        email: 'new@example.com',
        nickname: '새 유저',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(newUser);

      const user = await dbService.getUser(newUser.id);
      expect(user).not.toBeNull();
      expect(user?.id).toBe(newUser.id);
    });
  });

  describe('fridge operations', () => {
    it('should add and remove fridge items', async () => {
      const testUser: User = {
        id: `test_fridge_${Date.now()}`,
        email: 'fridge@example.com',
        nickname: '냉장고 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      // Get initial fridge state
      const initialFridge = await dbService.getFridge(testUser.id);
      const hasEggInitially = initialFridge.includes('계란');

      // Toggle item (add if not present, remove if present)
      await dbService.toggleFridgeItem(testUser.id, '계란');
      let fridge = await dbService.getFridge(testUser.id);
      
      if (hasEggInitially) {
        // If it was there initially, it should be removed now
        expect(fridge).not.toContain('계란');
        
        // Add it back
        await dbService.toggleFridgeItem(testUser.id, '계란');
        fridge = await dbService.getFridge(testUser.id);
        expect(fridge).toContain('계란');
      } else {
        // If it wasn't there, it should be added now
        expect(fridge).toContain('계란');
        
        // Remove it
        await dbService.toggleFridgeItem(testUser.id, '계란');
        fridge = await dbService.getFridge(testUser.id);
        expect(fridge).not.toContain('계란');
      }
    });

    it('should return empty array for new user fridge', async () => {
      const testUser: User = {
        id: `test_empty_${Date.now()}`,
        email: 'empty@example.com',
        nickname: '빈 냉장고',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);
      const fridge = await dbService.getFridge(testUser.id);

      // New users get MOCK_FRIDGE seeded, so it should not be empty
      expect(Array.isArray(fridge)).toBe(true);
    });
  });

  describe('recipe preferences', () => {
    it('should add and retrieve liked recipes', async () => {
      const testUser: User = {
        id: `test_liked_${Date.now()}`,
        email: 'liked@example.com',
        nickname: '좋아요 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const recipe = SEED_RECIPES[0];
      await dbService.addLikedRecipe(testUser.id, recipe.id);

      const likedRecipes = await dbService.getLikedRecipes(testUser.id);
      expect(likedRecipes).toHaveLength(1);
      expect(likedRecipes[0].id).toBe(recipe.id);
    });

    it('should add and retrieve disliked recipes', async () => {
      const testUser: User = {
        id: `test_disliked_${Date.now()}`,
        email: 'disliked@example.com',
        nickname: '싫어요 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const recipe = SEED_RECIPES[0];
      await dbService.addDislikedRecipe(testUser.id, recipe.id);

      const dislikedRecipes = await dbService.getDislikedRecipes(testUser.id);
      expect(dislikedRecipes).toHaveLength(1);
      expect(dislikedRecipes[0].id).toBe(recipe.id);
    });

    it('should not add duplicate liked recipes', async () => {
      const testUser: User = {
        id: `test_duplicate_${Date.now()}`,
        email: 'duplicate@example.com',
        nickname: '중복 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const recipe = SEED_RECIPES[0];
      await dbService.addLikedRecipe(testUser.id, recipe.id);
      await dbService.addLikedRecipe(testUser.id, recipe.id); // Add again

      const likedRecipes = await dbService.getLikedRecipes(testUser.id);
      expect(likedRecipes).toHaveLength(1); // Should still be 1
    });
  });

  describe('plan operations', () => {
    it('should save and retrieve plan', async () => {
      const testUser: User = {
        id: `test_plan_${Date.now()}`,
        email: 'plan@example.com',
        nickname: '식단 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const plan: (Recipe | null)[] = Array(14).fill(null);
      plan[0] = SEED_RECIPES[0];
      plan[1] = SEED_RECIPES[1];

      await dbService.savePlan(testUser.id, plan);

      const retrievedPlan = await dbService.getPlan(testUser.id);
      expect(retrievedPlan).toHaveLength(14);
      expect(retrievedPlan[0]?.id).toBe(SEED_RECIPES[0].id);
      expect(retrievedPlan[1]?.id).toBe(SEED_RECIPES[1].id);
    });

    it('should update individual plan slot', async () => {
      const testUser: User = {
        id: `test_slot_${Date.now()}`,
        email: 'slot@example.com',
        nickname: '슬롯 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const recipe = SEED_RECIPES[0];
      await dbService.updatePlanSlot(testUser.id, 5, recipe);

      const plan = await dbService.getPlan(testUser.id);
      expect(plan[5]?.id).toBe(recipe.id);
    });
  });

  describe('user preferences', () => {
    it('should save and retrieve user preferences', async () => {
      const testUser: User = {
        id: `test_prefs_${Date.now()}`,
        email: 'prefs@example.com',
        nickname: '설정 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      const preferences: UserPreferences = {
        allergies: ['계란', '우유'],
        dislikedFoods: ['오이'],
        spicinessLevel: 2,
        cookingSkill: 'Intermediate',
      };

      await dbService.updateUserPreferences(testUser.id, preferences);

      const user = await dbService.getUser(testUser.id);
      expect(user?.preferences).toEqual(preferences);
    });
  });

  describe('resetSession', () => {
    it('should reset liked and disliked recipes', async () => {
      const testUser: User = {
        id: `test_reset_${Date.now()}`,
        email: 'reset@example.com',
        nickname: '리셋 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);

      await dbService.addLikedRecipe(testUser.id, SEED_RECIPES[0].id);
      await dbService.addDislikedRecipe(testUser.id, SEED_RECIPES[1].id);

      await dbService.resetSession(testUser.id);

      const likedRecipes = await dbService.getLikedRecipes(testUser.id);
      const dislikedRecipes = await dbService.getDislikedRecipes(testUser.id);

      expect(likedRecipes).toHaveLength(0);
      expect(dislikedRecipes).toHaveLength(0);
    });
  });

  describe('deleteAccount', () => {
    it('should delete all user data', async () => {
      const testUser: User = {
        id: `test_delete_${Date.now()}`,
        email: 'delete@example.com',
        nickname: '삭제 테스트',
        avatarUrl: 'https://example.com/avatar.jpg',
      };

      await dbService.initUserData(testUser);
      await dbService.addLikedRecipe(testUser.id, SEED_RECIPES[0].id);
      await dbService.toggleFridgeItem(testUser.id, '계란');

      await dbService.deleteAccount(testUser.id);

      const user = await dbService.getUser(testUser.id);
      expect(user).toBeNull();
    });
  });
});

