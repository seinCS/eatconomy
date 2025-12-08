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
}

export interface MealSlot {
  day: string; // "Mon", "Tue", etc.
  type: 'Lunch' | 'Dinner';
  recipeId: number | null;
}

export type SwipeDirection = 'left' | 'right';

export interface ChainConnection {
  fromId: number;
  toId: number;
  sharedIngredients: string[];
}