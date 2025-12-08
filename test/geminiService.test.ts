import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateRecipeTip } from '../services/geminiService';
import { Recipe } from '../types';

describe('geminiService', () => {
  beforeEach(() => {
    // Reset environment variables
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateRecipeTip', () => {
    it('should return fallback message when API key is not set', async () => {
      // Mock environment to have no API key
      const originalEnv = process.env;
      process.env = { ...originalEnv };
      delete (process.env as any).API_KEY;
      delete (import.meta as any).env?.VITE_GEMINI_API_KEY;

      const recipe: Recipe = {
        id: 1,
        name: '테스트 레시피',
        ingredients: ['계란', '양파'],
        tags: [],
        time: '10분',
        calories: 100,
      };

      const result = await generateRecipeTip(recipe);

      expect(result).toContain('API 키가 설정되지 않아');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      process.env = originalEnv;
    });

    it('should handle recipe with context', async () => {
      const recipe: Recipe = {
        id: 1,
        name: '테스트 레시피',
        ingredients: ['계란', '양파'],
        tags: [],
        time: '10분',
        calories: 100,
      };

      const context = '냉장고에 계란이 많아요';

      // Since we don't have actual API key, this will return fallback
      const result = await generateRecipeTip(recipe, context);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle recipe without context', async () => {
      const recipe: Recipe = {
        id: 1,
        name: '테스트 레시피',
        ingredients: ['계란', '양파'],
        tags: [],
        time: '10분',
        calories: 100,
      };

      // Since we don't have actual API key, this will return fallback
      const result = await generateRecipeTip(recipe);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

