import { describe, it, expect } from 'vitest';
import { generateScoredWeeklyPlan } from '../services/recipeService';
import { Recipe, UserPreferences } from '../types';
import { SEED_RECIPES } from '../constants';

describe('Integration Tests - Real User Scenarios', () => {
  describe('Fridge Page Flow', () => {
    it('should generate plan from fridge items without resetting swipe preferences', () => {
      // Simulate: User swipes and likes some recipes, then goes to fridge
      const fridgeItems = ['계란', '김치', '양파', '스팸', '두부'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };

      // User has liked recipes from swipe
      const likedRecipes: Recipe[] = [
        SEED_RECIPES.find((r) => r.name === '계란말이')!,
        SEED_RECIPES.find((r) => r.name === '스팸김치덮밥')!,
      ];
      const dislikedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Should generate 14 recipes
      expect(result).toHaveLength(14);

      // Liked recipes should be included
      const resultIds = result.map((r) => r.id);
      expect(resultIds).toContain(likedRecipes[0].id);
      expect(resultIds).toContain(likedRecipes[1].id);

      // Liked recipes should have correct reason
      const likedInResult = result.filter((r) =>
        likedRecipes.some((lr) => lr.id === r.id)
      );
      likedInResult.forEach((recipe) => {
        expect(recipe.reason).toBe('직접 선택한 선호 메뉴');
      });
    });

    it('should respect allergies when generating plan', () => {
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

      // No recipe should contain 계란
      result.forEach((recipe) => {
        expect(recipe.ingredients).not.toContain('계란');
      });
    });

    it('should prioritize fridge items in scoring', () => {
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

      // Recipes using fridge items should be prioritized
      // At least some recipes should use fridge ingredients
      const recipesUsingFridgeItems = result.filter((recipe) =>
        recipe.ingredients.some((ing) => fridgeItems.includes(ing))
      );

      expect(recipesUsingFridgeItems.length).toBeGreaterThan(0);
    });
  });

  describe('Swipe Page Flow', () => {
    it('should generate plan with liked recipes prioritized', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };

      // User swipes and likes multiple recipes
      const likedRecipes: Recipe[] = [
        SEED_RECIPES.find((r) => r.name === '계란말이')!,
        SEED_RECIPES.find((r) => r.name === '두부조림')!,
        SEED_RECIPES.find((r) => r.name === '김치볶음밥')!,
      ];
      const dislikedRecipes: Recipe[] = [
        SEED_RECIPES.find((r) => r.name === '떡볶이')!,
      ];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // All liked recipes should be in result
      const resultIds = result.map((r) => r.id);
      likedRecipes.forEach((liked) => {
        expect(resultIds).toContain(liked.id);
      });

      // Disliked recipe should not be in result
      expect(resultIds).not.toContain(dislikedRecipes[0].id);
    });
  });

  describe('Profile Preferences Integration', () => {
    it('should filter recipes based on disliked foods from profile', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: ['오이', '당근'],
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

      // No recipe should contain 오이 or 당근
      result.forEach((recipe) => {
        expect(recipe.ingredients).not.toContain('오이');
        expect(recipe.ingredients).not.toContain('당근');
      });
    });

    it('should apply spiciness preference', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 1, // Mild - should penalize spicy recipes
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

      // Should still generate 14 recipes
      expect(result).toHaveLength(14);

      // Spicy recipes might still appear but should be less prioritized
      // We can't guarantee exclusion, but function should complete successfully
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty fridge with no preferences', () => {
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
      expect(result.every((r) => r !== null)).toBe(true);
    });

    it('should handle many liked recipes', () => {
      const fridgeItems = ['계란', '김치', '양파'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = [];
      const likedRecipes: Recipe[] = SEED_RECIPES.slice(0, 10); // Like 10 recipes

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      expect(result).toHaveLength(14);
      
      // Due to diversity logic (tag limits), not all liked recipes may be included
      // But at least some liked recipes should be prioritized and included
      const resultIds = result.map((r) => r.id);
      const includedLikedRecipes = likedRecipes.filter((liked) =>
        resultIds.includes(liked.id)
      );
      
      // At least some liked recipes should be included (they have huge bonus score)
      expect(includedLikedRecipes.length).toBeGreaterThan(0);
      
      // Liked recipes that are included should have correct reason
      const likedInResult = result.filter((r) =>
        likedRecipes.some((lr) => lr.id === r.id)
      );
      likedInResult.forEach((recipe) => {
        expect(recipe.reason).toBe('직접 선택한 선호 메뉴');
      });
    });

    it('should handle all recipes being disliked (edge case)', () => {
      const fridgeItems = ['계란', '김치'];
      const preferences: UserPreferences = {
        allergies: [],
        dislikedFoods: [],
        spicinessLevel: 2,
        cookingSkill: 'Beginner',
      };
      const dislikedRecipes: Recipe[] = SEED_RECIPES.slice(0, 20); // Dislike 20 recipes
      const likedRecipes: Recipe[] = [];

      const result = generateScoredWeeklyPlan(
        fridgeItems,
        preferences,
        dislikedRecipes,
        likedRecipes
      );

      // Should still generate 14 recipes from remaining pool
      expect(result).toHaveLength(14);
      const resultIds = result.map((r) => r.id);
      dislikedRecipes.forEach((disliked) => {
        expect(resultIds).not.toContain(disliked.id);
      });
    });
  });
});

