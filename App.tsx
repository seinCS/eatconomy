
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
import AuthCallbackPage from './pages/AuthCallback';
import ErrorBoundary from './components/ErrorBoundary';
import { Recipe, UserPreferences, User, MealSet } from './types';
import { getAllRecipes, generateScoredWeeklyPlan } from './services/recipeService';
import { authService } from './services/authService';
import { apiService } from './services/apiService';
import { WEEKLY_PLAN_SLOTS, SWIPE_CARD_COUNT } from './constants';
import { getTodayDateKey, getTodayMealIndices } from './utils/date';

// --- Context Setup ---
interface AppContextType {
  user: User | null;
  isCheckingAuth: boolean; // 인증 확인 중인지 여부
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
  plannedRecipes: MealSet[];
  updatePlan: (index: number, mealSet: MealSet) => void;
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
  const { user, isCheckingAuth } = useApp();
  const routeLocation = useLocation();

  // 인증 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 인증 확인이 완료되었지만 사용자가 없으면 로그인 페이지로
  if (!user) {
    return <Navigate to="/login" state={{ from: routeLocation }} replace />;
  }

  return <>{children}</>;
};

// --- Main App Component ---
const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // --- App Data State (Synced from DB) ---
  const [fridge, setFridge] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | undefined>(undefined);
  const [likedRecipes, setLikedRecipes] = useState<Recipe[]>([]);
  const [dislikedRecipes, setDislikedRecipes] = useState<Recipe[]>([]);
  const [plannedRecipes, setPlannedRecipes] = useState<MealSet[]>(Array(WEEKLY_PLAN_SLOTS).fill(null).map(() => ({ main: null, side: null })));
  const [shoppingListChecks, setShoppingListChecks] = useState<Record<string, boolean>>({});
  const [todayMealFinished, setTodayMealFinished] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // --- Check Authentication on Mount ---
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        
        // 에러 추적 서비스에 사용자 정보 설정
        if (currentUser) {
          const { errorTracking } = await import('./utils/errorTracking');
          errorTracking.setUser(currentUser.id, currentUser.email);
        }
      } catch (error) {
        const { logError } = await import('./utils/errors');
        logError(error, 'checkAuth');
        setUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // --- Load Data on Auth Change ---
  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        setIsLoadingData(true);
        try {
          // Initialize user data (백엔드에서 자동 처리)
          await apiService.initUserData(user);

          // Fetch all data in parallel from API
          const [
            fullUser,
            fridgeData, 
            planData, 
            likedData, 
            dislikedData, 
            shoppingData,
            todayStatus
          ] = await Promise.all([
            apiService.getUser(user.id),
            apiService.getFridge(user.id),
            apiService.getPlan(user.id),
            apiService.getLikedRecipes(user.id),
            apiService.getDislikedRecipes(user.id),
            apiService.getShoppingChecks(user.id),
            apiService.getTodayFinished(user.id)
          ]);

          setPreferences(fullUser?.preferences);
          setFridge(fridgeData);
          // API에서 받은 Recipe[]를 MealSet[]로 변환 (임시)
        // TODO: 백엔드 API가 MealSet[]를 반환하도록 업데이트 필요
        const mealSets: MealSet[] = planData.map(recipe => ({
          main: recipe,
          side: null // 반찬은 나중에 별도로 로드하거나 기본값 사용
        }));
        setPlannedRecipes(mealSets);
          setLikedRecipes(likedData);
          setDislikedRecipes(dislikedData);
          setShoppingListChecks(shoppingData);
          setTodayMealFinished(todayStatus);

        } catch (e) {
          const { logError } = await import('./utils/errors');
          logError(e, 'loadUserData');
        } finally {
          setIsLoadingData(false);
        }
      } else {
        // Clear state on logout
        setFridge([]);
        setPreferences(undefined);
        setPlannedRecipes(Array(WEEKLY_PLAN_SLOTS).fill(null).map(() => ({ main: null, side: null })));
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
    if (provider === 'kakao') {
      // 카카오 로그인: 카카오 인가 서버로 리다이렉트
      // 리다이렉트되므로 여기서는 아무것도 하지 않음
      authService.loginWithKakao();
    } else {
      // Google 로그인은 아직 구현 안 됨
      throw new Error('Google login not implemented yet');
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    
    // 에러 추적 서비스에서 사용자 정보 제거
    const { errorTracking } = await import('./utils/errorTracking');
    errorTracking.clearUser();
  };

  const deleteAccount = async () => {
    if (user) {
      await apiService.deleteAccount(user.id);
      await logout();
    }
  };

  // --- Data Actions (Proxies to API) ---
  const updatePreferences = async (prefs: UserPreferences) => {
    if (!user) return;
    setPreferences(prefs);
    await apiService.updateUserPreferences(user.id, prefs);
  };

  const toggleFridgeItem = async (item: string) => {
    if (!user) return;
    // Optimistic Update
    setFridge(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    // API Update
    try {
      const updatedFridge = await apiService.toggleFridgeItem(user.id, item);
      setFridge(updatedFridge);
    } catch (error) {
      // Rollback on error
      setFridge(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
      throw error;
    }
  };

  const addLikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setLikedRecipes(prev => [...prev, recipe]);
    try {
      await apiService.addLikedRecipe(user.id, recipe.id);
    } catch (error) {
      // Rollback on error
      setLikedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      throw error;
    }
  };

  const addDislikedRecipe = async (recipe: Recipe) => {
    if (!user) return;
    setDislikedRecipes(prev => [...prev, recipe]);
    try {
      await apiService.addDislikedRecipe(user.id, recipe.id);
    } catch (error) {
      // Rollback on error
      setDislikedRecipes(prev => prev.filter(r => r.id !== recipe.id));
      throw error;
    }
  };

  const updatePlan = async (index: number, mealSet: MealSet) => {
    if (!user) return;
    const newPlan = [...plannedRecipes];
    newPlan[index] = mealSet;
    setPlannedRecipes(newPlan);
    try {
      // API는 아직 Recipe 단일 구조를 지원하므로 메인만 저장 (임시)
      // TODO: 백엔드 API를 MealSet 구조로 업데이트 필요
      if (mealSet.main) {
        await apiService.updatePlanSlot(user.id, index, mealSet.main);
      }
    } catch (error) {
      // Rollback on error
      setPlannedRecipes(plannedRecipes);
      throw error;
    }
  };

  // Local/Hybrid generation (Using Scored Logic)
  const generatePlan = async () => {
    if (!user) return;
    try {
        // Use the advanced scoring algorithm that respects preferences and fridge
        const mealSets = generateScoredWeeklyPlan(fridge, preferences, dislikedRecipes, likedRecipes);
        
        setPlannedRecipes(mealSets);
        
        // API는 아직 Recipe[] 구조를 지원하므로 메인만 변환해서 저장 (임시)
        // TODO: 백엔드 API를 MealSet[] 구조로 업데이트 필요
        const mainRecipes = mealSets.map(ms => ms.main);
        await apiService.savePlan(user.id, mainRecipes);
    } catch (e) {
        const { logError } = await import('./utils/errors');
        logError(e, 'generatePlan');
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
      const { logError } = await import('./utils/errors');
      logError(error, 'generateAIPlan');
      alert("식단 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleShoppingItem = async (name: string) => {
    if (!user) return;
    setShoppingListChecks(prev => ({ ...prev, [name]: !prev[name] }));
    try {
      const updatedChecks = await apiService.toggleShoppingCheck(user.id, name);
      setShoppingListChecks(updatedChecks);
    } catch (error) {
      // Rollback on error
      setShoppingListChecks(prev => ({ ...prev, [name]: !prev[name] }));
      throw error;
    }
  };

  const toggleTodayMealFinished = async () => {
    if (!user) return;
    setTodayMealFinished(prev => !prev);
    try {
      const finished = await apiService.toggleTodayFinished(user.id);
      setTodayMealFinished(finished);
    } catch (error) {
      // Rollback on error
      setTodayMealFinished(prev => !prev);
      throw error;
    }
  };

  const toggleMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner') => {
    if (!user) return;
    try {
      await apiService.toggleMealFinished(user.id, dateKey, mealType);
    } catch (error) {
      const { logError } = await import('./utils/errors');
      logError(error, 'toggleMealFinished');
      throw error;
    }
  }, [user]);

  const getMealFinished = useCallback(async (dateKey: string, mealType: 'lunch' | 'dinner'): Promise<boolean> => {
    if (!user) return false;
    return await apiService.getMealFinished(user.id, dateKey, mealType);
  }, [user]);

  const resetSession = async () => {
    if (!user) return;
    setLikedRecipes([]);
    setDislikedRecipes([]);
    setTodayMealFinished(false);
    await apiService.resetSession(user.id);
  };

  // 인증 확인 중일 때 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      user, isCheckingAuth, login, logout, deleteAccount,
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
      <ErrorBoundary>
        <HashRouter>
          <div className="min-h-screen bg-gray-50 flex justify-center">
            <div className="w-full max-w-md bg-white min-h-screen shadow-xl relative flex flex-col">
              
              <div className="flex-1 overflow-y-auto no-scrollbar">
                 <Routes>
                  {/* Public Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
      </ErrorBoundary>
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
