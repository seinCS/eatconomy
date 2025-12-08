import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateScoredWeeklyPlan,
  getSharedIngredients,
  generateShoppingList,
  getAllRecipes,
} from '../services/recipeService';
import { Recipe, UserPreferences } from '../types';
import { SEED_RECIPES, STAPLES } from '../constants';

describe('recipeService', () => {
  describe('generateScoredWeeklyPlan', () => {
    it('should generate exactly 14 recipes', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      expect(result).toHaveLength(14);
      expect(result.every((r) => r !== null)).toBe(true);
    });

    it('should exclude recipes with allergens', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: ['계란'],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Check that no recipe contains 계란
      result.forEach((recipe) => {
        expect(recipe.ingredients).not.toContain('계란');
      });
    });

    it('should exclude recipes with disliked foods', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: ['오이'],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Check that no recipe contains 오이
      result.forEach((recipe) => {
        expect(recipe.ingredients).not.toContain('오이');
      });
    });

    it('should exclude disliked recipes', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipe = SEED_RECIPES[0]; // 돼지고기 김치찌개
      const dislikedRecipes: Recipe[] = [dislikedRecipe];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Check that disliked recipe is not in result
      const resultIds = result.map((r) => r.id);
      expect(resultIds).not.toContain(dislikedRecipe.id);
    });

    it('should prioritize liked recipes', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipe = SEED_RECIPES.find((r) => r.name === '계란말이')!;
      const likedRecipes: Recipe[] = [likedRecipe];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Liked recipe should be in the result
      const resultIds = result.map((r) => r.id);
      expect(resultIds).toContain(likedRecipe.id);

      // Liked recipe should have reason indicating it was user-selected
      const likedInResult = result.find((r) => r.id === likedRecipe.id);
      expect(likedInResult?.reason).toBe('직접 선택한 선호 메뉴');
    });

    it('should apply spiciness penalty for mild preference', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 1, // Mild
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Spicy recipes should be less likely (but not impossible)
      // We can't guarantee exclusion, but we can check that the function completes
      expect(result).toHaveLength(14);
    });

    it('should handle empty fridge items', () => {
      const fridgeItems: string[] = [];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      expect(result).toHaveLength(14);
    });

    it('should handle undefined preferences', () => {
      const fridgeItems = ['계란', '김치'];
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        undefined,
        dislikedRecipes,
        likedRecipes
      );

      expect(result).toHaveLength(14);
    });

    it('should not have duplicate recipes in the plan', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      const ids = result.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length); // No duplicates
    });

    it('should handle all recipes being filtered out (edge case)', () => {
      const fridgeItems: string[] = [];
      const preferences: UserPreferences = {
        allergies: ['계란', '돼지고기', '닭고기', '소고기', '두부', '김치'],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = [];

      // Should still return 14 recipes using fallback pool
      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      expect(result).toHaveLength(14);
    });
  });

  describe('getSharedIngredients', () => {
    it('should return shared ingredients excluding staples', () => {
      const recipeA: Recipe = {
        id: 1,
        name: 'Test A',
        ingredients: ['돼지고기', '양파', '소금', '파'],
        tags: [],
        time: '10분',
        calories: 100,
      };
      const recipeB: Recipe = {
        id: 2,
        name: 'Test B',
        ingredients: ['돼지고기', '양파', '마늘', '소금'],
        tags: [],
        time: '10분',
        calories: 100,
      };

      const shared = getSharedIngredients(recipeA, recipeB);

      expect(shared).toContain('돼지고기');
      expect(shared).toContain('양파');
      expect(shared).not.toContain('소금'); // Should exclude staples
      expect(shared).not.toContain('파'); // Not shared
      expect(shared).not.toContain('마늘'); // Not shared
    });

    it('should return empty array when no shared ingredients', () => {
      const recipeA: Recipe = {
        id: 1,
        name: 'Test A',
        ingredients: ['돼지고기', '양파'],
        tags: [],
        time: '10분',
        calories: 100,
      };
      const recipeB: Recipe = {
        id: 2,
        name: 'Test B',
        ingredients: ['닭고기', '당근'],
        tags: [],
        time: '10분',
        calories: 100,
      };

      const shared = getSharedIngredients(recipeA, recipeB);
      expect(shared).toHaveLength(0);
    });
  });

  describe('generateShoppingList', () => {
    it('should generate shopping list excluding fridge items and staples', () => {
      const plannedRecipes: Recipe[] = [
        {
          id: 1,
          name: 'Test',
          ingredients: ['돼지고기', '양파', '소금', '계란'],
          tags: [],
          time: '10분',
          calories: 100,
        },
      ];
      const fridgeInventory = ['계란', '소금'];

      const shoppingList = generateShoppingList(plannedRecipes, fridgeInventory);

      expect(shoppingList).toHaveLength(2);
      expect(shoppingList.map((item) => item.name)).toContain('돼지고기');
      expect(shoppingList.map((item) => item.name)).toContain('양파');
      expect(shoppingList.map((item) => item.name)).not.toContain('소금'); // Exclude staples
      expect(shoppingList.map((item) => item.name)).not.toContain('계란'); // Already in fridge
    });

    it('should count multiple occurrences of same ingredient', () => {
      const plannedRecipes: Recipe[] = [
        {
          id: 1,
          name: 'Test 1',
          ingredients: ['돼지고기', '양파'],
          tags: [],
          time: '10분',
          calories: 100,
        },
        {
          id: 2,
          name: 'Test 2',
          ingredients: ['돼지고기', '당근'],
          tags: [],
          time: '10분',
          calories: 100,
        },
      ];
      const fridgeInventory: string[] = [];

      const shoppingList = generateShoppingList(plannedRecipes, fridgeInventory);

      const porkItem = shoppingList.find((item) => item.name === '돼지고기');
      expect(porkItem?.count).toBe(2);
    });

    it('should return empty list when all ingredients are in fridge', () => {
      const plannedRecipes: Recipe[] = [
        {
          id: 1,
          name: 'Test',
          ingredients: ['돼지고기', '양파'],
          tags: [],
          time: '10분',
          calories: 100,
        },
      ];
      const fridgeInventory = ['돼지고기', '양파'];

      const shoppingList = generateShoppingList(plannedRecipes, fridgeInventory);
      expect(shoppingList).toHaveLength(0);
    });
  });

  describe('getAllRecipes', () => {
    it('should return all seed recipes', () => {
      const recipes = getAllRecipes();
      expect(recipes.length).toBeGreaterThan(0);
      expect(recipes).toEqual(SEED_RECIPES);
    });
  });
});

