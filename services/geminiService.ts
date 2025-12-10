import { GoogleGenAI, Type } from "@google/genai";
import { Recipe, UserPreferences } from "../types";
import { SEED_RECIPES } from "../constants";

/// <reference types="vite/client" />

// Helper to get API key safely supporting Vite and Node
const getApiKey = (): string | undefined => {
  // Check for Vite environment variable
  if (import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  // Fallback to standard process.env (Node.js 환경용)
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY;
  }
  return undefined;
};

export const generateRecipeTip = async (recipe: Recipe, context?: string): Promise<string> => {
  const apiKey = getApiKey();
  // If no API key is present, return a generic friendly message instead of throwing
  if (!apiKey) return "맛있는 식사 되세요! (API 키가 설정되지 않아 AI 팁을 불러올 수 없습니다)";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `
      You are a helpful home cooking assistant for a 1-person household.
      The user is planning to cook "${recipe.name}".
      Ingredients: ${recipe.ingredients.join(', ')}.
      
      ${context ? `Context: ${context}` : ''}

      Provide a short, 2-sentence "Zero Waste" tip or a quick cooking hack for this specific dish. 
      Keep it encouraging and practical.
      Answer in Korean.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "맛있는 식사 되세요!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "맛있는 식사 준비하세요! (AI 연결 일시적 오류)";
  }
};

export const generateEfficiencyAnalysis = async (weekPlan: Recipe[]): Promise<string> => {
  return ""; // Deprecated in favor of Real-time Dashboard
};

// --- Phase 3: AI Weekly Plan Generation (Selection Mode) ---

export const generateWeeklyPlanWithLLM = async (
  fridgeItems: string[],
  preferences: UserPreferences | undefined,
  dislikedRecipes: Recipe[]
): Promise<Recipe[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found. Please set VITE_GEMINI_API_KEY in .env");

  const ai = new GoogleGenAI({ apiKey });

  // 1. Pre-filtering: Safety First
  // Filter out recipes that contain allergens BEFORE sending to LLM context.
  const allergenList = preferences?.allergies || [];
  const dislikedList = preferences?.dislikedFoods || [];
  const dislikedIds = dislikedRecipes.map(r => r.id);

  const candidateRecipes = SEED_RECIPES.filter(recipe => {
    // Exclude if contains allergy
    const hasAllergen = recipe.ingredients.some(ing => allergenList.includes(ing));
    if (hasAllergen) return false;

    // Exclude explicit dislikes (from Swipe)
    if (dislikedIds.includes(recipe.id)) return false;

    return true;
  });

  // 2. Prepare Context Data (Recipe DB Summary)
  const recipeDbSummary = candidateRecipes.map(r => 
    `ID: ${r.id}, Name: "${r.name}", Ingredients: [${r.ingredients.join(', ')}]`
  ).join('\n');

  const userContext = `
    Fridge Inventory: ${fridgeItems.join(", ")}
    Disliked Ingredients: ${dislikedList.join(", ")}
    Allergies: ${allergenList.join(", ")}
    Spiciness Preference: ${preferences?.spicinessLevel || 1}/3
    Cooking Skill: ${preferences?.cookingSkill || "Beginner"}
  `;

  // 3. System Prompt (Selection Mode & Global Optimization)
  const systemPrompt = `
    Role: You are a smart Meal Plan Manager for a single-person household.
    Task: Select the best combination of recipes from the provided "Recipe DB" to create a 7-day meal plan (14 meals: Lunch & Dinner).

    **CRITICAL CONSTRAINTS**:
    1. SELECTION ONLY: You must ONLY select recipes provided in the "Recipe DB". Do NOT invent new recipes.
    2. OUTPUT FORMAT: You must return the 'recipe_id' for each slot.
    3. GLOBAL OPTIMIZATION: Maximize the usage of "Fridge Inventory" across the entire week.
    4. PREFERENCE CHECK: Avoid recipes containing "Disliked Ingredients" if possible.
    5. CRITICAL WARNING: User has a severe allergy to: [${allergenList.join(", ")}]. Do NOT include them under any circumstances.

    Input Data:
    [Recipe DB]
    ${recipeDbSummary}

    [User Profile]
    ${userContext}

    Output Format: Return ONLY JSON.
  `;

  // 4. JSON Schema (ID-based)
  const jsonSchema = {
    type: Type.OBJECT,
    properties: {
      weekly_plan: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Lunch", "Dinner"] },
            recipe_id: { type: Type.INTEGER },
            reason: { type: Type.STRING, description: "Why this was chosen" },
          },
          required: ["day", "type", "recipe_id", "reason"],
        },
      },
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: jsonSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");

    const parsed = JSON.parse(text);
    const planItems = parsed.weekly_plan;

    // 5. Map IDs back to full Recipe objects
    const recipes: Recipe[] = [];
    const getRandomSafeRecipe = () => candidateRecipes[Math.floor(Math.random() * candidateRecipes.length)];

    for (const item of planItems) {
        const originalRecipe = SEED_RECIPES.find(r => r.id === item.recipe_id);
        
        if (originalRecipe) {
            recipes.push({
                ...originalRecipe,
                reason: item.reason
            });
        } else {
            const fallback = getRandomSafeRecipe();
            if (fallback) {
                recipes.push({
                    ...fallback,
                    reason: "AI 추천 대체 메뉴"
                });
            }
        }
    }

    while (recipes.length < 14) {
        const fallback = getRandomSafeRecipe();
        if (fallback) {
            recipes.push({
                ...fallback,
                reason: "주간 식단 자동 채움"
            });
        }
    }

    return recipes.slice(0, 14);

  } catch (error) {
    console.error("Gemini Plan Gen Error:", error);
    throw error;
  }
};