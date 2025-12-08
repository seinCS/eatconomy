
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Home, Refrigerator, ShoppingCart, ChefHat } from 'lucide-react';

import HomePage from './pages/Home';
import SwipePage from './pages/Swipe';
import PlanPage from './pages/Plan';
import ListPage from './pages/List';
import FridgePage from './pages/Fridge';
import LoginPage from './pages/Login';
import ProfilePage from './pages/Profile';
import { Recipe, UserPreferences } from './types';
import { getAllRecipes, generateScoredWeeklyPlan } from './services/recipeService';
import { authService } from './services/authService';
import { dbService, User } from './services/dbService';

// --- Context Setup ---
interface AppContextType {
  user: User | null;
  login: (provider: 'kakao' | 'google') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  
  preferences: UserPreferences | undefined;
  updatePreferences: (prefs: UserPreferences) => Promise<void>;

  fridge: string[];
  toggleFridgeItem: (item: string) => void;
  likedRecipes: Recipe[];
  addLikedRecipe: (recipe: Recipe) => void;
  dislikedRecipes: Recipe[];
  addDislikedRecipe: (recipe: Recipe) => void;
  plannedRecipes: (Recipe | null)[];
  updatePlan: (index: number, recipe: Recipe) => void;
  generatePlan: () => Promise<void>;
  generateAIPlan: () => Promise<void>; // Updated to Scored Generation
  isGeneratingPlan: boolean; // Loading state

  shoppingListChecks: Record<string, boolean>;
  toggleShoppingItem: (name: string) => void;
  todayMealFinished: boolean; // Legacy - kept for backward compatibility
  toggleTodayMealFinished: () => void; // Legacy
  toggleMealFinished: (dateKey: string, mealType: 'lunch' | 'dinner') => Promise<void>;
  getMealFinished: (dateKey: string, mealType: 'lunch' | 'dinner') => Promise<boolean>;
  resetSession: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

// --- Protected Route Component ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useApp();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoadingData, setIsLoadingData] = useState(false);

  // --- App Data State (Synced from DB) ---
  const [fridge, setFridge] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [dislikedRecipes, setDislikedRecipes] = useState<Recipe[]>([]);
  const [plannedRecipes, setPlannedRecipes] = useState<(Recipe | null)[]>(Array(14).fill(null));
  const [shoppingListChecks, setShoppingListChecks] = useState<Record<string, boolean>>({});
  const [todayMealFinished, setTodayMealFinished] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // force redirect on mount
  useEffect(() => {
    if (window.location.hash !== '#/') {
      window.location.hash = '#/';
    }
  }, []);

  // --- Load Data on Auth Change ---
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          // Initialize DB for user if new
          await dbService.initUserData(user);

          // Fetch all data in parallel
          const [
            fullUser,
            fridgeData, 
            planData, 
            likedData, 
            dislikedData, 
            shoppingData,
            todayStatus
          ] = await Promise.all([
            dbService.getUser(user.id),
            dbService.getFridge(user.id),
            dbService.getPlan(user.id),
            dbService.getLikedRecipes(user.id),
            dbService.getDislikedRecipes(user.id),
            dbService.getShoppingChecks(user.id),
            dbService.getTodayFinished(user.id)
          ]);

          setPreferences(fullUser?.preferences);
          setFridge(fridgeData);
          setPlannedRecipes(planData);
          setLikedRecipes(likedData);
          setDislikedRecipes(dislikedData);
          setShoppingListChecks(shoppingData);
          setTodayMealFinished(todayStatus);

        } catch (e) {
          console.error("Failed to load user data", e);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        // Clear state on logout
        setFridge([]);
        setPreferences(undefined);
        setPlannedRecipes(Array(14).fill(null));
        setLikedRecipes([]);
        setDislikedRecipes([]);
        setShoppingListChecks({});
        setTodayMealFinished(false);
      }
    };

    loadUserData();
  }, [user]);

  // --- Auth Actions ---
  const login = async (provider: 'kakao' | 'google') => {
    let loggedUser;
    if (provider === 'kakao') {
      loggedUser = await authService.loginWithKakao();
    } else {
      loggedUser = await authService.loginWithGoogle();
    }
    setUser(loggedUser);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const deleteAccount = async () => {
    if (user) {
      await dbService.deleteAccount(user.id);
      await logout();
    }
  };

  // --- Data Actions (Proxies to DB) ---
  const updatePreferences = async (prefs: UserPreferences) => {
    if (!user) return;
    setPreferences(prefs);
    await dbService.updateUserPreferences(user.id, prefs);
  };

  const toggleFridgeItem = async (item: string) => {
    if (!user) return;
    // Optimistic Update
    setFridge(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    // DB Update
    await dbService.toggleFridgeItem(user.id, item);
  };

  const addLikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setLikedRecipes(prev => [...prev, recipe]);
    await dbService.addLikedRecipe(user.id, recipe.id);
  };

  const addDislikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setDislikedRecipes(prev => [...prev, recipe]);
    await dbService.addDislikedRecipe(user.id, recipe.id);
  };

  const updatePlan = async (index: number, recipe: Recipe) => {
    if (!user) return;
    const newPlan = [...plannedRecipes];
    newPlan[index] = recipe;
    setPlannedRecipes(newPlan);
    await dbService.updatePlanSlot(user.id, index, recipe);
  };

  // Local/Hybrid generation (Using Scored Logic)
  const generatePlan = async () => {
    if (!user) return;
    try {
        // Use the advanced scoring algorithm that respects preferences and fridge
        const scoredRecipes = generateScoredWeeklyPlan(fridge, preferences, dislikedRecipes, likedRecipes);
        
        const newPlan: (Recipe | null)[] = Array(14).fill(null);
        scoredRecipes.slice(0, 14).forEach((r, i) => newPlan[i] = r);
        
        setPlannedRecipes(newPlan);
        await dbService.savePlan(user.id, newPlan);
    } catch (e) {
        console.error("Error generating plan", e);
        throw e; // Propagate error for UI handling
    }
  };

  // Explicit AI/Scored Generation Trigger (e.g. from Fridge Page)
  const generateAIPlan = async () => {
    if (!user) return;
    setIsGeneratingPlan(true);
    
    // Simulate a small delay for better UX (making it feel like "analysis")
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // Re-use the same scoring logic
      await generatePlan();
    } catch (error) {
      console.error("Plan Generation Failed", error);
      alert("식단 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleShoppingItem = async (name: string) => {
    if (!user) return;
    setShoppingListChecks(prev => ({ ...prev, [name]: !prev[name] }));
    await dbService.toggleShoppingCheck(user.id, name);
  };

  const toggleTodayMealFinished = async () => {
    if (!user) return;
    setTodayMealFinished(prev => !prev);
    await dbService.toggleTodayFinished(user.id);
  };

  const toggleMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner') => {
    if (!user) return;
    await dbService.toggleMealFinished(user.id, dateKey, mealType);
  }, [user]);

  const getMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner'): Promise<boolean> => {
    if (!user) return false;
    return await dbService.getMealFinished(user.id, dateKey, mealType);
  }, [user]);

  const resetSession = async () => {
    if (!user) return;
    setLikedRecipes([]);
    setDislikedRecipes([]);
    setTodayMealFinished(false);
    await dbService.resetSession(user.id);
  };

  return (
    <AppContext.Provider value={{ 
      user, login, logout, deleteAccount,
      preferences, updatePreferences,
      fridge, toggleFridgeItem, 
      likedRecipes, addLikedRecipe, 
      dislikedRecipes, addDislikedRecipe,
      plannedRecipes, updatePlan, 
      generatePlan, generateAIPlan, isGeneratingPlan,
      shoppingListChecks, toggleShoppingItem,
      todayMealFinished, toggleTodayMealFinished,
      toggleMealFinished, getMealFinished,
      resetSession
    }}>
      <HashRouter>
        <div className="min-h-screen bg-gray-50 flex justify-center">
          <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col">
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
               <Routes>
                {/* Public Route */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/fridge" element={<ProtectedRoute><FridgePage /></ProtectedRoute>} />
                <Route path="/swipe" element={<ProtectedRoute><SwipePage /></ProtectedRoute>} />
                <Route path="/plan" element={<ProtectedRoute><PlanPage /></ProtectedRoute>} />
                <Route path="/list" element={<ProtectedRoute><ListPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>

            {/* Bottom Nav - Only show if logged in */}
            {user && <BottomNav />}
          </div>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

// --- Bottom Navigation ---
const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  if (location.pathname === '/swipe' || location.pathname === '/login') return null;

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/fridge', icon: Refrigerator, label: '냉장고' },
    { path: '/plan', icon: ChefHat, label: '식단표' },
    { path: '/list', icon: ShoppingCart, label: '장보기' },
  ];

  return (
    <nav className="sticky bottom-0 w-full bg-white border-t border-gray-100 py-3 px-6 flex justify-between items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center space-y-1 transition-colors ${
              isActive ? 'text-orange-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default App;
