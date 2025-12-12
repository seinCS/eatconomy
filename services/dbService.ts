import { Recipe, UserPreferences, WeeklyPlan, DailyPlan } from '../types';
import { MOCK_FRIDGE, SEED_RECIPES } from '../constants';

// --- Types representing DB Schema ---
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string;
  preferences?: UserPreferences;
}

interface DBState {
  users: Record<string, User>;
  fridgeItems: Record<string, string[]>; // userId -> ingredient names
  weeklyPlans: Record<string, (Recipe | null)[]>; // userId -> plan (레거시, 호환성 유지)
  weeklyPlansV2: Record<string, WeeklyPlan | null>; // userId -> WeeklyPlan (새 구조)
  likedRecipes: Record<string, number[]>; // userId -> recipeIds
  dislikedRecipes: Record<string, number[]>; // userId -> recipeIds
  shoppingChecks: Record<string, Record<string, boolean>>; // userId -> { item: bool }
  todayMealFinished: Record<string, boolean>; // userId -> bool (deprecated, kept for backward compatibility)
  mealFinished: Record<string, Record<string, boolean>>; // userId -> { "2024-12-08-lunch": true, "2024-12-08-dinner": false }
}

// --- Persistence Helper ---
const STORAGE_KEY = 'eat_conomy_db_v1';

const loadDB = (): DBState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure mealFinished exists for backward compatibility
      if (!parsed.mealFinished) {
        parsed.mealFinished = {};
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load DB from localStorage", e);
  }
  
  // Default Empty State
  return {
    users: {},
    fridgeItems: {},
    weeklyPlans: {},
    weeklyPlansV2: {},
    likedRecipes: {},
    dislikedRecipes: {},
    shoppingChecks: {},
    todayMealFinished: {},
    mealFinished: {}
  };
};

const saveDB = (state: DBState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save DB to localStorage", e);
  }
};

// Initialize DB from LocalStorage
const db: DBState = loadDB();

// --- Helpers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- DB Operations ---

export const dbService = {
  // Initialize User Data (Create default records if new)
  initUserData: async (user: User) => {
    // Simulate network delay
    await delay(100);

    // Update/Save user info
    db.users[user.id] = { ...user, preferences: db.users[user.id]?.preferences }; // Preserve prefs if exist

    if (!db.fridgeItems[user.id]) {
      // New User Setup
      db.fridgeItems[user.id] = [...MOCK_FRIDGE];
      db.weeklyPlans[user.id] = Array(14).fill(null);
      if (!db.weeklyPlansV2) db.weeklyPlansV2 = {};
      db.weeklyPlansV2[user.id] = null;
      db.likedRecipes[user.id] = [];
      db.dislikedRecipes[user.id] = [];
      db.shoppingChecks[user.id] = {};
      db.todayMealFinished[user.id] = false;
      db.mealFinished[user.id] = {};
    }
    saveDB(db);
  },

  getUser: async (userId: string): Promise<User | null> => {
      return db.users[userId] || null;
  },

  updateUserPreferences: async (userId: string, prefs: UserPreferences) => {
      await delay(100);
      if (db.users[userId]) {
          db.users[userId].preferences = prefs;
          saveDB(db);
      }
  },

  // Fridge
  getFridge: async (userId: string): Promise<string[]> => {
    return db.fridgeItems[userId] || [];
  },
  toggleFridgeItem: async (userId: string, item: string): Promise<string[]> => {
    const current = db.fridgeItems[userId] || [];
    if (current.includes(item)) {
      db.fridgeItems[userId] = current.filter(i => i !== item);
    } else {
      db.fridgeItems[userId] = [...current, item];
    }
    saveDB(db);
    return db.fridgeItems[userId];
  },

  // Preferences (Like/Dislike)
  getLikedRecipes: async (userId: string): Promise<Recipe[]> => {
    const ids = db.likedRecipes[userId] || [];
    return SEED_RECIPES.filter(r => ids.includes(r.id));
  },
  addLikedRecipe: async (userId: string, recipeId: number) => {
    const current = db.likedRecipes[userId] || [];
    if (!current.includes(recipeId)) {
      db.likedRecipes[userId] = [...current, recipeId];
      saveDB(db);
    }
  },
  
  getDislikedRecipes: async (userId: string): Promise<Recipe[]> => {
    const ids = db.dislikedRecipes[userId] || [];
    return SEED_RECIPES.filter(r => ids.includes(r.id));
  },
  addDislikedRecipe: async (userId: string, recipeId: number) => {
    const current = db.dislikedRecipes[userId] || [];
    if (!current.includes(recipeId)) {
      db.dislikedRecipes[userId] = [...current, recipeId];
      saveDB(db);
    }
  },

  // Plan (레거시, 호환성 유지)
  getPlan: async (userId: string): Promise<(Recipe | null)[]> => {
    return db.weeklyPlans[userId] || Array(14).fill(null);
  },
  savePlan: async (userId: string, newPlan: (Recipe | null)[]) => {
    db.weeklyPlans[userId] = newPlan;
    saveDB(db);
  },
  updatePlanSlot: async (userId: string, index: number, recipe: Recipe) => {
    const plan = db.weeklyPlans[userId] || Array(14).fill(null);
    plan[index] = recipe;
    db.weeklyPlans[userId] = plan;
    saveDB(db);
  },

  // WeeklyPlan (새 구조)
  getWeeklyPlan: async (userId: string): Promise<WeeklyPlan | null> => {
    if (!db.weeklyPlansV2) {
      db.weeklyPlansV2 = {};
      saveDB(db);
    }
    
    // 새 구조에서 먼저 확인
    if (db.weeklyPlansV2[userId] !== undefined) {
      return db.weeklyPlansV2[userId];
    }
    
    // 레거시 데이터가 있으면 마이그레이션 시도
    const legacyPlan = db.weeklyPlans[userId];
    if (legacyPlan && legacyPlan.some(r => r !== null)) {
      console.log('[dbService] 레거시 데이터 마이그레이션 시도...');
      // 레거시 데이터는 null로 설정 (마이그레이션 불가능)
      if (!db.weeklyPlansV2) db.weeklyPlansV2 = {};
      db.weeklyPlansV2[userId] = null;
      saveDB(db);
    }
    
    return null;
  },
  saveWeeklyPlan: async (userId: string, weeklyPlan: WeeklyPlan | null) => {
    if (!db.weeklyPlansV2) {
      db.weeklyPlansV2 = {};
    }
    db.weeklyPlansV2[userId] = weeklyPlan;
    saveDB(db);
  },

  // Shopping List Checks
  getShoppingChecks: async (userId: string): Promise<Record<string, boolean>> => {
    return db.shoppingChecks[userId] || {};
  },
  toggleShoppingCheck: async (userId: string, item: string) => {
    const checks = db.shoppingChecks[userId] || {};
    db.shoppingChecks[userId] = {
      ...checks,
      [item]: !checks[item]
    };
    saveDB(db);
    return db.shoppingChecks[userId];
  },

  // Daily Status (Legacy - kept for backward compatibility)
  getTodayFinished: async (userId: string): Promise<boolean> => {
    return db.todayMealFinished[userId] || false;
  },
  toggleTodayFinished: async (userId: string) => {
    db.todayMealFinished[userId] = !db.todayMealFinished[userId];
    saveDB(db);
    return db.todayMealFinished[userId];
  },

  // Meal-specific completion tracking
  getMealFinished: async (userId: string, dateKey: string, mealType: 'lunch' | 'dinner'): Promise<boolean> => {
    const mealKey = `${dateKey}-${mealType}`;
    const result = db.mealFinished[userId]?.[mealKey] || false;
    console.log('getMealFinished 조회:', { userId, mealKey, result, dbState: db.mealFinished[userId] });
    return result;
  },
  toggleMealFinished: async (userId: string, dateKey: string, mealType: 'lunch' | 'dinner'): Promise<boolean> => {
    if (!db.mealFinished[userId]) {
      db.mealFinished[userId] = {};
    }
    const mealKey = `${dateKey}-${mealType}`;
    const currentValue = db.mealFinished[userId][mealKey] || false;
    db.mealFinished[userId][mealKey] = !currentValue;
    saveDB(db);
    console.log('toggleMealFinished 저장:', { userId, mealKey, newValue: db.mealFinished[userId][mealKey], dbState: db.mealFinished[userId] });
    return db.mealFinished[userId][mealKey];
  },

  // Session Reset
  resetSession: async (userId: string) => {
    db.likedRecipes[userId] = [];
    db.dislikedRecipes[userId] = [];
    db.todayMealFinished[userId] = false;
    saveDB(db);
  },

  // Account Deletion
  deleteAccount: async (userId: string) => {
    delete db.users[userId];
    delete db.fridgeItems[userId];
    delete db.weeklyPlans[userId];
    if (db.weeklyPlansV2) {
      delete db.weeklyPlansV2[userId];
    }
    delete db.likedRecipes[userId];
    delete db.dislikedRecipes[userId];
    delete db.shoppingChecks[userId];
    delete db.todayMealFinished[userId];
    delete db.mealFinished[userId];
    saveDB(db);
  }
};